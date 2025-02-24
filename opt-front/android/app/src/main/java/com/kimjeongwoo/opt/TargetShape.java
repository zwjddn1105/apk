package com.kimjeongwoo.opt;

public class TargetShape {
    private final int firstLandmarkType;
    private final int middleLandmarkType;
    private final int lastLandmarkType;
    private final double startAngle;
    private final double endAngle;

    public TargetShape(int firstLandmarkType, int middleLandmarkType, int lastLandmarkType, double startAngle, double endAngle) {
        this.firstLandmarkType = firstLandmarkType;
        this.middleLandmarkType = middleLandmarkType;
        this.lastLandmarkType = lastLandmarkType;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
    }

    public int getFirstLandmarkType() {
        return firstLandmarkType;
    }

    public int getMiddleLandmarkType() {
        return middleLandmarkType;
    }

    public int getLastLandmarkType() {
        return lastLandmarkType;
    }

    public double getStartAngle() {
        return startAngle;
    }

    public double getEndAngle() {
        return endAngle;
    }
}
