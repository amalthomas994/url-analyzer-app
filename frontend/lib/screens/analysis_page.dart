import 'package:flutter/material.dart';
import 'package:frontend/models/analysis_result.dart';
import 'package:frontend/services/url_analyzer_service.dart';
import 'package:frontend/widgets/image_details_card.dart';
import 'package:frontend/widgets/link_list_card.dart';
import 'package:frontend/screens/settings_page.dart';

//stateful widget
//provides users an interface to enter a URL which triggers a backend API call.
//the response is presented in a structured format using ImageDetailCards and LinkListCards
class AnalysisPage extends StatefulWidget {
  const AnalysisPage({super.key});

  @override
  State<AnalysisPage> createState() => _AnalysisPageState();
}

class _AnalysisPageState extends State<AnalysisPage> {
  final TextEditingController _urlController =
      TextEditingController(); //used to manage text being entered into TextField widget
  bool _isLoading = false; //flag to check if URL analysis is in progress
  String? _displayMessage; //message to display on TextField
  AnalysisResult?
  _analysisResult; //parsed result from backend if analysis is successful
  String? _detailedErrorMessage; //variable to store detailed error message

  late final UrlAnalyzerService _urlAnalyzerService; // Initialize service

  //initState called once when the State object is created and inserted into widget tree
  @override
  void initState() {
    super.initState();
    _urlAnalyzerService = UrlAnalyzerService(
      'http://localhost:3000',
    ); // Backend URL
  }

  //async function which runs when "Analyze" button is clicked
  //urlToSubmit is an optional parameter that is used when the user taps on a Internal/External Link
  Future<void> _analyzeUrl({String? urlToSubmit}) async {
    final String urlFromInput =
        urlToSubmit ??
        _urlController
            .text; //if urlToSubmit is provided then use that for parsing, otherwise get user inputted text

    //checks to see if input is empty
    if (urlFromInput.isEmpty) {
      setState(() {
        _displayMessage = "Please enter a URL.";
        _analysisResult = null;
        _detailedErrorMessage = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _displayMessage = "Fetching URL...";
      _analysisResult = null;
      _detailedErrorMessage = null;
    });

    final result = await _urlAnalyzerService.analyzeUrl(
      urlFromInput,
    ); //makes API call to backend

    if (!mounted)
      return; //if widget is removed from the widget tree before await completes, return

    setState(() {
      _analysisResult = result;
      if (result.error != null) {
        _displayMessage = result.error;
        _detailedErrorMessage = result.message;
      } else {
        _displayMessage = null;
        _analysisResult = result;
        _detailedErrorMessage = null;
      }
      _isLoading = false;
    });
  }

  //helper function for when user clicks on a internal/external url
  void _analyzeNewUrl(String url) {
    _urlController.text = url; //sets TextField text to selected url text
    _analyzeUrl(urlToSubmit: url); //triggers new analysis of selected url
  }

  void _showDetailedErrorDialog() {
    if (_detailedErrorMessage != null && _detailedErrorMessage!.isNotEmpty) {
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text("Error Details"),
            content: SingleChildScrollView(child: Text(_detailedErrorMessage!)),
            actions: <Widget>[
              TextButton(
                child: const Text("Close"),
                onPressed: () {
                  Navigator.of(context).pop(); // Close the dialog
                },
              ),
            ],
          );
        },
      );
    }
  }

  //called when State object is removed from widget tree
  @override
  void dispose() {
    _urlController.dispose(); //disposes controller
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Widget contentWidget;
    final TextStyle? appBarTitleStyle = Theme.of(context)
        .textTheme
        .headlineSmall
        ?.copyWith(
          color:
              Theme.of(context).appBarTheme.titleTextStyle?.color ??
              (Theme.of(context).brightness == Brightness.dark
                  ? Colors.white
                  : Colors.black54),
        );
    const double appBarIconSize = 28.0;
    if (_isLoading) {
      contentWidget = const Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: CircularProgressIndicator(),
        ),
      );
    } else if (_analysisResult != null && _analysisResult?.error == null) {
      // If analysis results are available and no error
      contentWidget = _buildResultsView(_analysisResult!);
    } else if (_displayMessage != null) {
      // Show message if an explicit message is set AND we don't have results yet
      contentWidget = Padding(
        padding: const EdgeInsets.symmetric(vertical: 16.0),
        child: Column(
          children: [
            Text(
              _displayMessage!,
              style: TextStyle(
                color: _analysisResult != null && _analysisResult?.error == null
                    ? Theme.of(context)
                          .colorScheme
                          .primary // Success color
                    : Theme.of(context).colorScheme.error, // Error color
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            if (_detailedErrorMessage != null)
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.info_outline),
                  label: const Text("Show Details"),
                  onPressed: _showDetailedErrorDialog,
                ),
              ),
          ],
        ),
      );
    } else {
      contentWidget = Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 40.0, horizontal: 16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.search,
                size: 60,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
              ),
              const SizedBox(height: 16),
              Text(
                'Enter a URL above to analyze its content, images, and links.',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.7),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Tap on internal or external links in the results to analyze them further.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(
                    context,
                  ).colorScheme.onSurface.withOpacity(0.6),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,

          children: [
            Icon(
              Icons.travel_explore_outlined,
              color: appBarTitleStyle?.color,
              size: appBarIconSize,
            ),
            const SizedBox(width: 10),
            RichText(
              text: TextSpan(
                style: appBarTitleStyle,
                children: <TextSpan>[
                  const TextSpan(
                    text: 'URL ',
                    style: TextStyle(fontWeight: FontWeight.w100),
                  ),
                  const TextSpan(
                    text: 'Analyzer',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            tooltip: 'Settings',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const SettingsPage()),
              );
            },
          ),
        ],
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _urlController,
                      decoration: InputDecoration(
                        labelText: 'Enter URL',
                        hintText: 'e.g., google.com',
                        prefixIcon: const Icon(Icons.link),
                        suffixIcon:
                            _urlController
                                .text
                                .isNotEmpty //show X when text field is not empty
                            ? IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: () {
                                  _urlController
                                      .clear(); //clicking X will clear text field
                                  setState(() {});
                                },
                              )
                            : null,
                      ),
                      keyboardType: TextInputType.url, //optimize for URL input
                      onChanged: (value) => setState(
                        () {},
                      ), //call set state when text field changes
                      onSubmitted: _isLoading
                          ? null
                          : (_) =>
                                _analyzeUrl(), //when user presses enter on keyboard, run analyzeURL only if isloading is false
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    //analyze button
                    onPressed: _isLoading
                        ? null
                        : () =>
                              _analyzeUrl(), // run analyzeURL only if isloading is false
                    child:
                        _isLoading //show circular loading progress if isLoading is true, otherwise just the text Analyze
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Analyze'),
                  ),
                ],
              ),
              const SizedBox(height: 20.0),
              // Display Area for Messages, Loading, or Results
              contentWidget, // Display the chosen content widget here
              // --- End of corrected part ---
            ],
          ),
        ),
      ),
    );
  }

  // Widget tree to display results of AnalysisResult
  Widget _buildResultsView(AnalysisResult result) {
    final textTheme = Theme.of(context).textTheme;
    return Column(
      //arranges all sections vertically
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Text(
          'Results for: ${result.requestedURL}', //show url that was analyzed
          style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const Divider(height: 24),

        ImageDetailsCard(
          imageDetails: result.imageDetails,
        ), //show image details
        const Divider(height: 24),

        LinkListCard(
          //show internal links
          title: 'Internal Links',
          links: result.internalLinks,
          isInternal: true,
          onLinkTap: _analyzeNewUrl, //function to call when user taps on link
        ),
        const Divider(height: 24),

        LinkListCard(
          //show external links
          title: 'External Links',
          links: result.externalLinks,
          isInternal: false,
          onLinkTap: _analyzeNewUrl, //function to call when user taps on link
        ),
      ],
    );
  }
}
