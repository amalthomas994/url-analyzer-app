import 'package:flutter/material.dart';

class ThemeNotifier with ChangeNotifier {
  // _currentThemeMode holds the current theme mode.
  ThemeMode _currentThemeMode = ThemeMode.system; // Default to system theme

  // Getter to provide read-only access to the current theme mode
  ThemeMode get currentThemeMode => _currentThemeMode;

  // Setter to update the theme mode
  void setThemeMode(ThemeMode newMode) {
    if (_currentThemeMode != newMode) {
      //checks if the new mode is different from the current one to avoid unnecessary updates
      _currentThemeMode = newMode;
      notifyListeners(); // tell all listening widgets to rebuild
    }
  }

  void toggleTheme() {
    _currentThemeMode = _currentThemeMode == ThemeMode.dark
        ? ThemeMode.light
        : ThemeMode.dark;
    notifyListeners();
  }
}
