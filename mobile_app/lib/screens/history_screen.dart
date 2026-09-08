import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../database/offline_database.dart';
import '../models/scan_record.dart';
import '../services/sync_service.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({Key? key}) : super(key: key);

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<ScanRecord> _scans = [];
  bool _isLoading = true;
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoading = true);
    final scans = await OfflineDatabase.instance.getAllScans();
    setState(() {
      _scans = scans;
      _isLoading = false;
    });
  }

  Future<void> _syncNow() async {
    setState(() => _isSyncing = true);
    final result = await SyncService().syncPendingRecords();
    setState(() => _isSyncing = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result['message'] as String),
        backgroundColor: (result['success'] as bool) ? Colors.green.shade700 : Colors.orange.shade800,
      ),
    );
    _loadHistory();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'NORMAL':
        return const Color(0xFF16A34A);
      case 'ACTION_REQUIRED':
        return const Color(0xFFD97706);
      case 'DANGER_EXCEEDED':
      default:
        return const Color(0xFFDC2626);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('Offline SQLite Scan History', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: _isSyncing
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Icon(Icons.sync),
            onPressed: _isSyncing ? null : _syncNow,
            tooltip: 'Sync with PostgreSQL Backend',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _scans.isEmpty
              ? const Center(
                  child: Text('No dosimeter scans logged yet.\nUse "ONE-SHOT BADGE SCAN" to record shifts.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF64748B))),
                )
              : RefreshIndicator(
                  onRefresh: _loadHistory,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _scans.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final scan = _scans[index];
                      final color = _getStatusColor(scan.complianceStatus);
                      final timeStr = DateFormat('dd-MMM HH:mm').format(scan.scannedAt);

                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 5,
                                      backgroundColor: color,
                                    ),
                                    const SizedBox(width: 8),
                                    Text('${scan.workerCode} - ${scan.workerName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: scan.isSynced ? Colors.green.shade50 : Colors.amber.shade50,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: scan.isSynced ? Colors.green.shade300 : Colors.amber.shade300),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(scan.isSynced ? Icons.cloud_done : Icons.cloud_off, size: 12, color: scan.isSynced ? Colors.green.shade800 : Colors.amber.shade900),
                                      const SizedBox(width: 4),
                                      Text(scan.isSynced ? 'SYNCED' : 'LOCAL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: scan.isSynced ? Colors.green.shade800 : Colors.amber.shade900)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text('${scan.department} • Badge ${scan.badgeUid}', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                            const Divider(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Dosage: ${scan.cumulativeDosagePpmHr} ppm·hr', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                Text('TWA: ${scan.avgConcentrationPpm} ppm', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
                                Text(timeStr, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
