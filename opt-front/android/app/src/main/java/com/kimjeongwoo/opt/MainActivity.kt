package com.kimjeongwoo.opt

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import com.google.common.util.concurrent.ListenableFuture
import com.google.mlkit.vision.pose.Pose
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseDetector
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import com.kimjeongwoo.opt.databinding.ActivityMainBinding
import com.kimjeongwoo.opt.PoseMatcher_Java



class MainActivity : ReactActivity() {
    companion object {
        private const val TAG = "CameraXApp"
        private val REQUIRED_PERMISSIONS = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO
        )

        private val poseMap: Map<String, MakePose> = mapOf(
            //"스쿼트" to Squat(),
            "동그라미" to OSign()
            //"랫풀다운" to LatPullDown()
        )
    }

    private var isPoseDetectionEnabled = false
    private var count = 0
    private lateinit var poseDetector: PoseDetector
    private lateinit var cameraExecutor: ExecutorService
    private var currentPose: MakePose? = null
    private lateinit var tvCount: TextView
    private lateinit var viewBinding: ActivityMainBinding

    private val permissionsLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            if (permissions.all { it.value }) {
                startCamera()
            } else {
                Toast.makeText(this, "Permissions not granted by the user.", Toast.LENGTH_SHORT).show()
                finish()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setTheme(R.style.AppTheme)
        
        if (allPermissionsGranted()) {
            startCamera()
        } else {
            permissionsLauncher.launch(REQUIRED_PERMISSIONS)
        }

        val exerciseSpinner: Spinner = findViewById(R.id.exerciseSpinner)
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, poseMap.keys.toList())
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        exerciseSpinner.adapter = adapter

        var selectedExercise = adapter.getItem(0) ?: ""

        exerciseSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                count = 0
                tvCount.text = "0회"
                selectedExercise = parent?.getItemAtPosition(position).toString()
                Toast.makeText(this@MainActivity, "선택한 운동: $selectedExercise", Toast.LENGTH_SHORT).show()
            }

            override fun onNothingSelected(parent: AdapterView<*>?) {
                selectedExercise = ""
            }
        }

        val options = PoseDetectorOptions.Builder()
            .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
            .build()
        poseDetector = PoseDetection.getClient(options)

        cameraExecutor = Executors.newSingleThreadExecutor()
    }

    private fun allPermissionsGranted(): Boolean {
        return REQUIRED_PERMISSIONS.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun startCamera() {
        val cameraProviderFuture: ListenableFuture<ProcessCameraProvider> =
            ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            try {
                val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

                // Preview 설정
                val preview = Preview.Builder().build().apply {
                    setSurfaceProvider(viewBinding.viewFinder.surfaceProvider) // ✅ viewBinding 사용
                }


                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()

                imageAnalysis.setAnalyzer(cameraExecutor, CameraAnalyzer(poseDetector) { pose ->
                    onPoseDetected(pose)
                })

                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    this, cameraSelector, preview, imageAnalysis
                )

            } catch (e: Exception) {
                Log.e(TAG, "Use case binding failed", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun onPoseDetected(pose: Pose) {
        currentPose?.let {
            val isMatched = PoseMatcher_Java().match(pose, it)
            Log.d(TAG, if (isMatched) "TRUE!!!!!" else "FALSE@@@@")
            if (isMatched) {
                count++
                Log.d(TAG, "$count 회!")
                tvCount.text = "$count 회!"
            } else {
                Log.d(TAG, "$count 회, 하강 전!!!!!!!")
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName,
                fabricEnabled
            ){}
        )
    }

    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                super.invokeDefaultOnBackPressed()
            }
            return
        }
        super.invokeDefaultOnBackPressed()
    }
}
