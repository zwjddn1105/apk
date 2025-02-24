package com.kimjeongwoo.opt;

import androidx.annotation.NonNull;
import android.content.Intent;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.google.mlkit.vision.pose.Pose;

public class PoseMatcherModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "PoseMatcherModule";

    public PoseMatcherModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "PoseMatcherModule";
    }

    @ReactMethod
    public void matchPose(Pose pose, Promise promise) {
        try {
            PoseMatcher_Java matcher = new PoseMatcher_Java();
            // MakePose는 적절한 인스턴스로 변경 필요
            MakePose currentPose = new OSign(); 
            boolean isMatched = matcher.match(pose, currentPose);
            promise.resolve(isMatched);
        } catch (Exception e) {
            promise.reject("MATCH_ERROR", e);
        }
    }

    @ReactMethod
    public void startCamera(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            Intent intent = new Intent(context, MainActivity.class); // ✅ MainActivity 실행 (카메라 열기)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            promise.resolve("카메라 실행됨");
        } catch (Exception e) {
            promise.reject("CAMERA_ERROR", e);
        }
    }
}
