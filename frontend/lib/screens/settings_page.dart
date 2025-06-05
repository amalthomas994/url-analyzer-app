// lib/screens/settings_page.dart (Updated to StatefulWidget)

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frontend/theme_notifier.dart'; // Ensure this import path is correct for your project 'frontend'

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _isThemeExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeNotifier>(
      builder: (context, themeNotifier, _) {
        String currentThemeModeText = '';
        switch (themeNotifier.currentThemeMode) {
          case ThemeMode.system:
            currentThemeModeText = 'System Default';
            break;
          case ThemeMode.light:
            currentThemeModeText = 'Light';
            break;
          case ThemeMode.dark:
            currentThemeModeText = 'Dark';
            break;
        }

        return Scaffold(
          appBar: AppBar(title: const Text('Settings'), centerTitle: false),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                // Section Header: Display
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16.0,
                    vertical: 12.0,
                  ),
                  child: Text(
                    'Display',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: Theme.of(context).colorScheme.secondary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                ListTile(
                  leading: Icon(
                    themeNotifier.currentThemeMode == ThemeMode.dark
                        ? Icons.dark_mode
                        : Icons.light_mode,
                  ),
                  title: const Text('Theme'),
                  subtitle: Text(currentThemeModeText),
                  trailing: Icon(
                    _isThemeExpanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                  ),
                  onTap: () {
                    setState(() {
                      _isThemeExpanded = !_isThemeExpanded;
                    });
                  },
                ),
                AnimatedCrossFade(
                  firstChild: const SizedBox.shrink(),
                  secondChild: Column(
                    children: [
                      RadioListTile<ThemeMode>(
                        title: const Text('System Default'),
                        value: ThemeMode.system,
                        groupValue: themeNotifier.currentThemeMode,
                        onChanged: (ThemeMode? mode) {
                          if (mode != null) {
                            themeNotifier.setThemeMode(mode);
                            setState(() {
                              _isThemeExpanded = false;
                            });
                          }
                        },
                      ),
                      RadioListTile<ThemeMode>(
                        title: const Text('Light'),
                        value: ThemeMode.light,
                        groupValue: themeNotifier.currentThemeMode,
                        onChanged: (ThemeMode? mode) {
                          if (mode != null) {
                            themeNotifier.setThemeMode(mode);
                            setState(() {
                              _isThemeExpanded = false;
                            });
                          }
                        },
                      ),
                      RadioListTile<ThemeMode>(
                        title: const Text('Dark'),
                        value: ThemeMode.dark,
                        groupValue: themeNotifier.currentThemeMode,
                        onChanged: (ThemeMode? mode) {
                          if (mode != null) {
                            themeNotifier.setThemeMode(mode);
                            setState(() {
                              _isThemeExpanded = false;
                            });
                          }
                        },
                      ),
                    ],
                  ),
                  crossFadeState: _isThemeExpanded
                      ? CrossFadeState.showSecond
                      : CrossFadeState.showFirst,
                  duration: const Duration(milliseconds: 300),
                  firstCurve: Curves.easeOut,
                  secondCurve: Curves.easeIn,
                ),

                const Divider(height: 1),
              ],
            ),
          ),
        );
      },
    );
  }
}
