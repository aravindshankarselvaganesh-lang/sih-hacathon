import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;
import '../models/scan_record.dart';

class OfflineDatabase {
  static final OfflineDatabase instance = OfflineDatabase._init();
  static Database? _database;

  OfflineDatabase._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('sulfscan_offline.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 2,
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_uuid TEXT UNIQUE NOT NULL,
        worker_code TEXT NOT NULL,
        worker_name TEXT NOT NULL,
        department TEXT NOT NULL,
        badge_uid TEXT NOT NULL,
        shift_type TEXT NOT NULL,
        scan_event TEXT NOT NULL,
        ambient_temp_c REAL NOT NULL,
        relative_humidity REAL NOT NULL,
        weather_source TEXT NOT NULL,
        extracted_l REAL NOT NULL,
        extracted_a REAL NOT NULL,
        extracted_b REAL NOT NULL,
        delta_e REAL NOT NULL,
        exposure_hours REAL NOT NULL,
        cumulative_dosage_ppm_hr REAL NOT NULL,
        avg_concentration_ppm REAL NOT NULL,
        compliance_status TEXT NOT NULL,
        dgms_compliant INTEGER NOT NULL,
        oisd_compliant INTEGER NOT NULL,
        scanned_at TEXT NOT NULL,
        is_synced INTEGER NOT NULL DEFAULT 0
      )
    ''');
    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_scans_synced_at ON scans(is_synced, scanned_at)',
    );
  }

  Future<void> _upgradeDB(Database db, int oldVersion, int newVersion) async {
    // v1 -> v2: add covering index for pending-sync queries.
    if (oldVersion < 2) {
      await db.execute(
        'CREATE INDEX IF NOT EXISTS idx_scans_synced_at ON scans(is_synced, scanned_at)',
      );
    }
  }

  Future<int> insertScan(ScanRecord record) async {
    final db = await instance.database;
    return await db.insert(
      'scans',
      record.toMap(),
      conflictAlgorithm: ConflictAlgorithm.abort,
    );
  }

  Future<List<ScanRecord>> getPendingSyncRecords() async {
    final db = await instance.database;
    final result = await db.query(
      'scans',
      where: 'is_synced = ?',
      whereArgs: [0],
      orderBy: 'scanned_at ASC',
    );
    return result.map((map) => ScanRecord.fromMap(map)).toList();
  }

  /// Lightweight helper for badges / sync scheduling without loading rows.
  Future<int> getPendingCount() async {
    final db = await instance.database;
    return Sqflite.firstIntValue(
          await db.rawQuery('SELECT COUNT(*) FROM scans WHERE is_synced = 0'),
        ) ??
        0;
  }

  Future<void> markAsSynced(List<String> clientUuids) async {
    if (clientUuids.isEmpty) return;
    final db = await instance.database;
    await db.transaction((txn) async {
      for (var i = 0; i < clientUuids.length; i += 500) {
        final end = (i + 500 < clientUuids.length) ? i + 500 : clientUuids.length;
        final chunk = clientUuids.sublist(i, end);
        final placeholders = List.filled(chunk.length, '?').join(',');
        await txn.rawUpdate(
          'UPDATE scans SET is_synced = 1 WHERE client_uuid IN ($placeholders)',
          chunk,
        );
      }
    });
  }

  Future<List<ScanRecord>> getAllScans() async {
    final db = await instance.database;
    final result = await db.query(
      'scans',
      orderBy: 'scanned_at DESC',
      limit: 100,
    );
    return result.map((map) => ScanRecord.fromMap(map)).toList();
  }

  Future<Map<String, int>> getExposureStats() async {
    final db = await instance.database;
    final total = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM scans')) ?? 0;
    final normal = Sqflite.firstIntValue(await db.rawQuery("SELECT COUNT(*) FROM scans WHERE compliance_status = 'NORMAL'")) ?? 0;
    final action = Sqflite.firstIntValue(await db.rawQuery("SELECT COUNT(*) FROM scans WHERE compliance_status = 'ACTION_REQUIRED'")) ?? 0;
    final danger = Sqflite.firstIntValue(await db.rawQuery("SELECT COUNT(*) FROM scans WHERE compliance_status = 'DANGER_EXCEEDED'")) ?? 0;
    final pendingSync = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM scans WHERE is_synced = 0')) ?? 0;

    return {
      'total': total,
      'normal': normal,
      'action': action,
      'danger': danger,
      'pending_sync': pendingSync,
    };
  }
}
