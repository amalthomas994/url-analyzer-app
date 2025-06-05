//Data model to describe the structure of the image JSON data received from the backend.
class ImageTypeDetail {
  final int count; //num of images of specific extension
  final int totalSize; //total size of all images of this extension in bytes
  final List<String> sources; // list of urls where the images originated

  ImageTypeDetail({
    //requires all the following parameters
    required this.count,
    required this.totalSize,
    required this.sources,
  });

  // factory constructor to create ImageTypeDetail instance from a JSON
  factory ImageTypeDetail.fromJson(Map<String, dynamic> json) {
    return ImageTypeDetail(
      count: json['count'] ?? 0,
      totalSize: json['totalSize'] ?? 0,
      sources: List<String>.from(json['sources'] ?? []),
    );
  }
}
