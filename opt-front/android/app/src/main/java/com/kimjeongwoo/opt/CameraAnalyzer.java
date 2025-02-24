package com.kimjeongwoo.opt;

import android.media.Image;
import android.util.Log;

import androidx.annotation.OptIn;
import androidx.camera.core.ExperimentalGetImage;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.pose.Pose;
import com.google.mlkit.vision.pose.PoseDetector;

public class CameraAnalyzer implements ImageAnalysis.Analyzer {
    private static final String TAG = "CameraAnalyzer";
    private final PoseDetector poseDetector;
    private final OnPoseDetectedListener onPoseDetectedListener;
    private long lastDetectionTime = 0L;

    private static boolean isPoseDetectionEnabled = true; // 이 값은 상황에 따라 변경 가능

    public interface OnPoseDetectedListener {
        void onPoseDetected(Pose pose);
    }

    public CameraAnalyzer(PoseDetector poseDetector, OnPoseDetectedListener onPoseDetectedListener) {
        this.poseDetector = poseDetector;
        this.onPoseDetectedListener = onPoseDetectedListener;
    }

    @OptIn(markerClass = ExperimentalGetImage.class)
    @Override
    public void analyze(ImageProxy imageProxy) {
        if (!isPoseDetectionEnabled) {
            imageProxy.close();
            return;
        }

        long currentTime = System.currentTimeMillis();
        if (currentTime - lastDetectionTime < 100) {
            imageProxy.close();
            return;  // 0.1초가 지나지 않았으면 감지하지 않음
        }
        lastDetectionTime = currentTime; // 감지 시간 업데이트

        Image mediaImage = imageProxy.getImage();
        if (mediaImage == null) {
            imageProxy.close();
            return;
        }

        InputImage inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.getImageInfo().getRotationDegrees());

        poseDetector.process(inputImage)
                .addOnSuccessListener(pose -> onPoseDetectedListener.onPoseDetected(pose))
                .addOnFailureListener(e -> Log.e(TAG, "Pose detection error: " + e.getMessage()))
                .addOnCompleteListener(task -> {
                    imageProxy.close();
                    mediaImage.close();
                });
    }
}
