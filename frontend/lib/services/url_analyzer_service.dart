import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:frontend/models/analysis_result.dart';

//fetch data from backend server
class UrlAnalyzerService {
  final String _backendBaseUrl; //base url of backend server

  UrlAnalyzerService(this._backendBaseUrl);

  Future<AnalysisResult> analyzeUrl(String url) async {
    //async operation returning an AnalysisResult object
    String processedUrl = url;

    // ensures that the URL sent to the backend has a valid scheme
    if (!processedUrl.startsWith('http://') &&
        !processedUrl.startsWith('https://')) {
      processedUrl = 'https://$processedUrl'; // Default to https
    }

    //create request URL
    final Uri requestUri = Uri.parse('$_backendBaseUrl/analyze_url').replace(
      queryParameters: {'url': processedUrl},
    ); //addds url parameter to the URL

    try {
      final response = await http
          .get(requestUri)
          .timeout(const Duration(seconds: 45)); //sends HTTP get to backend

      if (response.statusCode == 200) {
        final Map<String, dynamic> decodedJson = jsonDecode(response.body);
        return AnalysisResult.fromJson(
          decodedJson,
        ); //return AnalysisResult object containing result from backend response
      } else {
        // Handle non-200 HTTP status codes
        String displayError = 'Failed to analyze URL.';
        String detailedError;
        try {
          // Attempt to parse error message from JSON response.
          final Map<String, dynamic> errorJson = jsonDecode(response.body);
          displayError =
              errorJson['error'] ?? 'Server error: ${response.statusCode}';
          detailedError =
              errorJson['message'] ??
              displayError; //try to find error or message from response
        } catch (e) {
          displayError = 'Server error: ${response.statusCode}.';
          detailedError =
              'Server error: ${response.statusCode}. Raw response: ${response.body.substring(0, (response.body.length > 100) ? 100 : response.body.length)}...';
        }
        // Return an AnalysisResult with an error
        return AnalysisResult(
          requestedURL: url,
          imageDetails: {},
          internalLinks: [],
          externalLinks: [],
          error: displayError,
          message: detailedError,
        );
      }
    } catch (e) {
      String networkErrorMsg = "Network Error: ${e.toString()}";
      return AnalysisResult(
        // Catch any other exceptions like network erros or timeouts
        requestedURL: url,
        imageDetails: {},
        internalLinks: [],
        externalLinks: [],
        error: "Connection failed. Please check your URL or network.",
        message: networkErrorMsg,
      );
    }
  }
}
