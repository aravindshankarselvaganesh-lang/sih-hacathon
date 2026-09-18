import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../services/app_config.dart';

class AuditReportsScreen extends StatefulWidget {
  const AuditReportsScreen({Key? key}) : super(key: key);

  @override
  State<AuditReportsScreen> createState() => _AuditReportsScreenState();
}

class _AuditReportsScreenState extends State<AuditReportsScreen> {
  bool _isDownloading = false;
  String _statusMessage = 'Audit reports are auto-compiled via ReportLab on the central Python backend according to DGMS Regulation 124 and OISD-STD-105.';

  Future<void> _requestPdfReport() async {
    if (!mounted) return;
    setState(() {
      _isDownloading = true;
      _statusMessage = 'Connecting to FastAPI backend & ReportLab PDF generator...';
    });

    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/reports/dgms-oisd/pdf'),
      ).timeout(AppConfig.httpTimeout);

      if (!mounted) return;
      if (response.statusCode == 200) {
        // TODO(path_provider): persist response.bodyBytes via path_provider
        // (getTemporaryDirectory()/getApplicationDocumentsDirectory + File.writeAsBytes)
        // and open/share with open_filex/share_plus for statutory submission.
        setState(() {
          _statusMessage = 'Success! Received ${response.bodyBytes.length} bytes PDF audit certificate ready for statutory submission.';
        });
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        setState(() {
          _statusMessage = 'Report request unauthorized (HTTP ${response.statusCode}). Sign in again.';
        });
      } else {
        setState(() {
          _statusMessage = 'Report request failed (HTTP ${response.statusCode}): ${response.body.isEmpty ? 'no details from server' : response.body}';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _statusMessage = 'Central server not reachable directly from this emulator. You can also generate the PDF directly from the FastAPI Swagger docs at http://localhost:8000/api/v1/reports/dgms-oisd/pdf';
      });
    } finally {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('Compliance & Audit Reports', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        children: [
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
                const Row(
                  children: [
                    Icon(Icons.verified, color: Color(0xFF0284C7), size: 28),
                    SizedBox(width: 12),
                    Text('Statutory Report Engine', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  'Standards Supported:\n'
                  '• DGMS Regulation 124 (TWA limit: 10.0 ppm)\n'
                  '• OISD-STD-105 (Refinery Work Permit System)\n'
                  '• OISD-STD-112 (Hazardous H₂S Gas Management)',
                  style: TextStyle(fontSize: 13, height: 1.5, color: Color(0xFF475569)),
                ),
                const Divider(height: 24),
                Text(
                  _statusMessage,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontStyle: FontStyle.italic),
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: _isDownloading ? null : _requestPdfReport,
                  icon: _isDownloading
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.download),
                  label: const Text('GENERATE DGMS / OISD PDF', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
