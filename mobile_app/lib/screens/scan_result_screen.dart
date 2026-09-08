import 'package:flutter/material.dart';
import '../models/scan_record.dart';

class ScanResultScreen extends StatelessWidget {
  final ScanRecord record;

  const ScanResultScreen({Key? key, required this.record}) : super(key: key);

  Color _getStatusColor() {
    switch (record.complianceStatus) {
      case 'NORMAL':
        return const Color(0xFF16A34A);
      case 'ACTION_REQUIRED':
        return const Color(0xFFD97706);
      case 'DANGER_EXCEEDED':
      default:
        return const Color(0xFFDC2626);
    }
  }

  IconData _getStatusIcon() {
    switch (record.complianceStatus) {
      case 'NORMAL':
        return Icons.verified;
      case 'ACTION_REQUIRED':
        return Icons.warning_amber_rounded;
      case 'DANGER_EXCEEDED':
      default:
        return Icons.dangerous_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('Dosimetry Audit Result', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Compliance Status Banner
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: statusColor, width: 1.5),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: statusColor,
                  radius: 26,
                  child: Icon(_getStatusIcon(), color: Colors.white, size: 30),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        record.complianceStatus.replaceAll('_', ' '),
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: statusColor),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        record.dgmsCompliant
                            ? 'Compliant with DGMS Reg. 124 & OISD-STD-105'
                            : 'NON-COMPLIANT: Immediate Shift Evacuation Required',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Primary Dosage Metrics Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('AI Regressed Exposure Levels', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const Divider(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildMetricCol('Cumulative Dosage', '${record.cumulativeDosagePpmHr}', 'ppm·hr', const Color(0xFF0284C7)),
                    Container(height: 45, width: 1, color: const Color(0xFFE2E8F0)),
                    _buildMetricCol('Shift TWA (8h)', '${record.avgConcentrationPpm}', 'ppm', statusColor),
                  ],
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: (record.avgConcentrationPpm / 15.0).clamp(0.0, 1.0),
                    backgroundColor: const Color(0xFFE2E8F0),
                    valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 6),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('0 ppm (Safe)', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                    Text('5 ppm (Action)', style: TextStyle(fontSize: 10, color: Color(0xFFD97706))),
                    Text('10 ppm (DGMS TWA Limit)', style: TextStyle(fontSize: 10, color: Color(0xFFDC2626), fontWeight: FontWeight.bold)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Technical Diagnostics (OpenCV & Environmental Fusion)
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Spectrophotometric & Telemetry Fusion', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                const SizedBox(height: 12),
                _buildInfoRow('Worker Code', record.workerCode),
                _buildInfoRow('Worker Name', record.workerName),
                _buildInfoRow('Department', record.department),
                _buildInfoRow('Badge UID (DataMatrix)', record.badgeUid),
                const Divider(height: 16),
                _buildInfoRow('CIE Color Delta (ΔE)', '${record.deltaE.toStringAsFixed(2)} units'),
                _buildInfoRow('Normalized CIE L*a*b*', 'L*=${record.extractedL.toStringAsFixed(1)}, a*=${record.extractedA.toStringAsFixed(1)}, b*=${record.extractedB.toStringAsFixed(1)}'),
                _buildInfoRow('Ambient Temperature', '${record.ambientTempC.toStringAsFixed(1)} °C'),
                _buildInfoRow('Relative Humidity', '${record.relativeHumidity.toStringAsFixed(1)} %'),
                _buildInfoRow('Fusion Source', record.weatherSource),
                _buildInfoRow('Local Storage', 'Saved to SQLite (Offline Queue)'),
              ],
            ),
          ),
          const SizedBox(height: 24),

          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('DONE / RETURN TO DASHBOARD', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCol(String label, String value, String unit, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: color)),
        Text('$unit ($label)', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
            ),
          ),
        ],
      ),
    );
  }
}
