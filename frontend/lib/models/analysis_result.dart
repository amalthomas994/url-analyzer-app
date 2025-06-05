import 'package:frontend/models/image_type_detail.dart';

//Data model representing result of API call
class AnalysisResult {
  final String requestedURL; //url requested for analysis
  final Map<String, ImageTypeDetail>
  imageDetails; //map containing details about images found
  final List<String> internalLinks; //internal url links found in requestedURL
  final List<String> externalLinks; //external url links found in requestedURL
  final String? message;
  final String? error;

  AnalysisResult({
    required this.requestedURL,
    required this.imageDetails,
    required this.internalLinks,
    required this.externalLinks,
    this.message, //optional
    this.error, //optional
  });

  //factory for deserializing JSON into an AnalysisResult object
  factory AnalysisResult.fromJson(Map<String, dynamic> json) {
    Map<String, ImageTypeDetail> parsedImageDetails =
        {}; //empty map to store parsed ImageTypeDetail objects
    if (json['imageDetails'] != null && json['imageDetails'] is Map) {
      //ensure imageDetails key exist and JSON is a valid map
      (json['imageDetails'] as Map<String, dynamic>).forEach((key, value) {
        //iterate over imageDetails
        if (value is Map<String, dynamic>) {
          //ensure each value is a map
          parsedImageDetails[key] = ImageTypeDetail.fromJson(
            value,
          ); //add to parsedImageDetails map
        }
      });
    }
    return AnalysisResult(
      requestedURL: json['requestedURL'] ?? 'N/A',
      imageDetails: parsedImageDetails,
      internalLinks: List<String>.from(
        json['internalLinks'] ?? [],
      ), //ensure URL elements are strings
      externalLinks: List<String>.from(
        json['externalLinks'] ?? [],
      ), //ensure URL elements are strings
      message: json['message'],
      error: json['error'],
    );
  }
}
