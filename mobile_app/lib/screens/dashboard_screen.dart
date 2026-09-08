import 'package:flutter/material.dart';
import '../database/offline_database.dart';
import '../services/sync_service.dart';
import 'scan_dosimeter_screen.dart';
import 'history_screen.dart';
import 'audit_reports_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, int> _stats = {
    'total': 0,
    'normal': 0,
    'action': 0,
    'danger': 0,
    'pending_sync': 0,
  };
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final stats = await OfflineDatabase.instance.getExposureStats();
    setState(() {
      _stats = stats;
    });
  }

  Future<void> _triggerSync() async {
    setState(() => _isSyncing = true);
    final result = await SyncService().syncPendingRecords();
    setState(() => _isSyncing = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result['message'] as String),
        backgroundColor: (result['success'] as bool) ? Colors.green.shade700 : Colors.orange.shade800,
      ),
    );
    _loadStats();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('SULFSCAN REFINERY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('DGMS & OISD-STD-105 Compliant', style: TextStyle(fontSize: 11, color: Color(0xFF38BDF8))),
          ],
        ),
        actions: [
          IconButton(
            icon: _isSyncing
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Badge(
                    label: Text('${_stats['pending_sync']}'),
                    isLabelVisible: (_stats['pending_sync'] ?? 0) > 0,
                    child: const Icon(Icons.cloud_upload_outlined),
                  ),
            onPressed: _isSyncing ? null : _triggerSync,
            tooltip: 'Sync with Central PostgreSQL',
          ),
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_outlined),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AuditReportsScreen()));
            },
            tooltip: 'DGMS / OISD PDF Reports',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadStats,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Status Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: Colors.blue.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('REFINERY ACTIVE SHIFT', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
                      Chip(
                        label: Text('SHIFT A • 06:00 - 14:00', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                        backgroundColor: Color(0x33FFFFFF),
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text('H₂S Colorimetric Badge Scanner', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  const Text('One-shot mobile OpenCV colorimetry + Arrhenius AI dosimeter calibration.', style: TextStyle(color: Colors.white70, fontSize: 13)),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () async {
                      await Navigator.push(context, MaterialPageRoute(builder: (_) => const ScanDosimeterScreen()));
                      _loadStats();
                    },
                    icon: const Icon(Icons.camera_alt, color: Color(0xFF0369A1)),
                    label: const Text('ONE-SHOT BADGE SCAN', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0369A1))),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Statistics Grid
            const Text('Statutory Exposure Metrics', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
            const SizedBox(height: 10),
            Row(
              children: [
                _buildStatCard('Total Scans', '${_stats['total']}', Icons.badge, const Color(0xFF64748B)),
                const SizedBox(width: 10),
                _buildStatCard('Safe (< 5 ppm)', '${_stats['normal']}', Icons.verified_user, const Color(0xFF16A34A)),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _buildStatCard('Action (5-10 ppm)', '${_stats['action']}', Icons.warning_amber, const Color(0xFFD97706)),
                const SizedBox(width: 10),
                _buildStatCard('Exceeded (> 10 ppm)', '${_stats['danger']}', Icons.dangerous, const Color(0xFFDC2626)),
              ],
            ),
            const SizedBox(height: 24),

            // Navigation Options
            ListTile(
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              leading: const CircleAvatar(
                backgroundColor: Color(0xFFE2E8F0),
                child: Icon(Icons.history, color: Color(0xFF0F172A)),
              ),
              title: const Text('Shift Scan History', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('${_stats['total']} records stored offline in SQLite'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const HistoryScreen()));
              },
            ),
            const SizedBox(height: 12),
            ListTile(
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              leading: const CircleAvatar(
                backgroundColor: Color(0xFFE2E8F0),
                child: Icon(Icons.picture_as_pdf, color: Color(0xFF0284C7)),
              ),
              title: const Text('Statutory Audit Reports', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Auto-generate DGMS & OISD compliance PDF'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const AuditReportsScreen()));
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: color.withOpacity(0.12),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
                Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
