package com.kimjeongwoo.opt;


import com.kimjeongwoo.opt.MakePose;
import com.kimjeongwoo.opt.TargetPose;
import com.kimjeongwoo.opt.TargetShape;
import com.google.mlkit.vision.pose.Pose;
import com.google.mlkit.vision.pose.PoseLandmark;

import java.util.ArrayList;
import java.util.List;

public class PoseMatcher_Java {

    public boolean match(Pose pose, MakePose currentPose) {
        boolean result = extractAndMatch(pose, currentPose);
        return result;
    }

    private boolean extractAndMatch(Pose pose, MakePose currentPose) {
        TargetPose targetPose = currentPose.targetPose();
        List<Boolean> matchResults = new ArrayList<>(); // 모든 조건을 저장하는 리스트

        int index = 0;
        for (TargetShape target : targetPose.getTargets()) {
            PoseLandmark firstLandmark = extractLandmarkFromType(pose, target.getFirstLandmarkType());
            PoseLandmark middleLandmark = extractLandmarkFromType(pose, target.getMiddleLandmarkType());
            PoseLandmark lastLandmark = extractLandmarkFromType(pose, target.getLastLandmarkType());

            if (landmarkNotFound(firstLandmark, middleLandmark, lastLandmark)) {
                matchResults.add(false); // 해당 조건이 실패함을 저장
                continue;
            }

            double angle = calculateAngle(firstLandmark, middleLandmark, lastLandmark);

            boolean isPoseMatched = currentPose.isCount(target.getStartAngle(), target.getEndAngle(), angle, pose, ++index);

            matchResults.add(isPoseMatched);
        }
        boolean allMatched = !matchResults.contains(false); // 하나라도 false가 있으면 최종 false
        return allMatched;
//        return true;
//        TargetPose targetPose = currentPose.targetPose();
//
//        return targetPose.getTargets().parallelStream().allMatch(target -> {
//            PoseLandmark firstLandmark = extractLandmarkFromType(pose, target.getFirstLandmarkType());
//            PoseLandmark middleLandmark = extractLandmarkFromType(pose, target.getMiddleLandmarkType());
//            PoseLandmark lastLandmark = extractLandmarkFromType(pose, target.getLastLandmarkType());
//
//            if (landmarkNotFound(firstLandmark, middleLandmark, lastLandmark)) {
//                return false;
//            }
//
//            double angle = calculateAngle(firstLandmark, middleLandmark, lastLandmark);
//            Log.d("ANGLE", "angle : " + angle + " startAngle :  " + target.getStartAngle() + " endAngle : " + target.getEndAngle());
//
//            if (currentPose.isCount(target.getStartAngle(), target.getEndAngle(), angle, pose)) {
//                Log.d("SUCCESS", "COUNT UP********");
//                return true;
//            }
//            return false;
//        });
    }

    private PoseLandmark extractLandmarkFromType(Pose pose, int landmarkType) {
        return pose.getPoseLandmark(landmarkType);
    }

    private boolean landmarkNotFound(PoseLandmark firstLandmark, PoseLandmark middleLandmark, PoseLandmark lastLandmark) {
        return firstLandmark == null || middleLandmark == null || lastLandmark == null;
    }

    private double calculateAngle(PoseLandmark firstLandmark, PoseLandmark middleLandmark, PoseLandmark lastLandmark) {
        double ax = firstLandmark.getPosition3D().getX() - middleLandmark.getPosition3D().getX();
        double ay = firstLandmark.getPosition3D().getY() - middleLandmark.getPosition3D().getY();

        double bx = lastLandmark.getPosition3D().getX() - middleLandmark.getPosition3D().getX();
        double by = lastLandmark.getPosition3D().getY() - middleLandmark.getPosition3D().getY();

        double dotProduct = (ax * bx) + (ay * by);

        double normA = Math.sqrt(ax * ax + ay * ay);
        double normB = Math.sqrt(bx * bx + by * by);

        double angle = Math.toDegrees(Math.acos(dotProduct / (normA * normB)));

        if (Double.isNaN(angle)) {
            angle = 0.0;
        }
        return angle;
    }
}


