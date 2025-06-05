import 'package:flutter/material.dart';
import 'package:frontend/screens/analysis_page.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  // AnimationController to manage the animation lifecycle
  late AnimationController _controller;
  // Animation for scaling icon
  late Animation<double> _scaleAnimation;
  // Animation for fading in text
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    // Initialize AnimationController
    _controller = AnimationController(
      vsync: this, // 'this' refers to the SingleTickerProviderStateMixin
      duration: const Duration(seconds: 2), // Total duration of the animation
    );

    // scale animation from 0.0 to 1.0 (icon grows)
    _scaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));

    // fade animation from 0.0 to 1.0 (text fades in)
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(
          0.5,
          1.0,
          curve: Curves.easeIn,
        ), // Starts halfway through scale animation
      ),
    );

    // Start the animation when the widget is initialized
    _controller.forward();

    // After a delay, navigate to the main screen
    _navigateToHome();
  }

  void _navigateToHome() async {
    await Future.delayed(
      const Duration(seconds: 3),
    ); // Display splash for 3 seconds

    if (!mounted) return; // Ensure the widget is still in the tree

    // Navigate to the AnalysisPage and remove SplashScreen from the navigation stack
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const AnalysisPage()),
    );
  }

  @override
  void dispose() {
    _controller.dispose(); // Dispose of the animation controller
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Use the theme's primary color for the background
    final Color primaryColor = Theme.of(context).colorScheme.primary;
    final Color onPrimaryColor = Theme.of(context).colorScheme.onPrimary;

    return Scaffold(
      backgroundColor: primaryColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            // Animated icon
            ScaleTransition(
              scale: _scaleAnimation, // Apply the scaling animation
              child: Icon(Icons.link, size: 100, color: onPrimaryColor),
            ),
            const SizedBox(height: 20),
            // Animated text
            FadeTransition(
              opacity: _fadeAnimation, // Apply the fading animation
              child: Text(
                'URL Analyzer',
                style: TextStyle(
                  color: onPrimaryColor, // Contrast color for text
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 30), // Spacing
            FadeTransition(
              opacity: _fadeAnimation,
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(onPrimaryColor),
                strokeWidth: 3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
