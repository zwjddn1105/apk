package com.kimjeongwoo.opt;

import java.util.List;

public class TargetPose {
    private final List<TargetShape> targets;

    public TargetPose(List<TargetShape> targets) {
        this.targets = targets;
    }

    public List<TargetShape> getTargets() {
        return targets;
    }
}
