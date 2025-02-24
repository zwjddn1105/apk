package com.kimjeongwoo.opt;
import com.kimjeongwoo.opt.MakePose;
import com.kimjeongwoo.opt.TargetPose;
import com.kimjeongwoo.opt.TargetShape;
import com.google.mlkit.vision.pose.Pose;

public interface MakePose {
    TargetPose targetPose();
    boolean isCount(double startAngle, double endAngle, double angle, Pose pose, int index);
}
