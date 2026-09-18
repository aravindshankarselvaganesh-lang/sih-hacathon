import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';

class CameraService {
  CameraController? _controller;
  List<CameraDescription> _cameras = [];
  bool _isInitialized = false;

  CameraController? get controller => _controller;
  bool get isInitialized => _isInitialized && _controller != null && _controller!.value.isInitialized;

  Future<void> initialize() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) return;

      final backCamera = _cameras.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.back,
        orElse: () => _cameras.first,
      );

      _controller = CameraController(
        backCamera,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _controller!.initialize();
      // Lock focus and auto-exposure for macro badge photography
      await _controller!.setFocusMode(FocusMode.auto);
      _isInitialized = true;
    } catch (e, stackTrace) {
      debugPrint('CameraService.initialize failed: $e');
      debugPrint('$stackTrace');
      _isInitialized = false;
      rethrow;
    }
  }

  Future<XFile?> takeBadgePicture() async {
    if (!isInitialized) return null;
    try {
      final file = await _controller!.takePicture();
      return file;
    } catch (e, stackTrace) {
      debugPrint('CameraService.takeBadgePicture failed: $e');
      debugPrint('$stackTrace');
      return null;
    }
  }

  Future<void> toggleFlash(bool enable) async {
    if (!isInitialized) return;
    try {
      await _controller!.setFlashMode(enable ? FlashMode.torch : FlashMode.off);
    } catch (e, stackTrace) {
      debugPrint('CameraService.toggleFlash failed: $e');
      debugPrint('$stackTrace');
      rethrow;
    }
  }

  Future<void> dispose() async {
    try {
      await _controller?.dispose();
    } finally {
      _controller = null;
      _isInitialized = false;
    }
  }
}
