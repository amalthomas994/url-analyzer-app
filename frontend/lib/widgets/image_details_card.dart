import 'package:flutter/material.dart';
import 'package:frontend/models/image_type_detail.dart';
import 'package:frontend/utils/formatters.dart';

IconData _getIconForExtension(String extension) {
  switch (extension.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return Icons.photo_camera_back_outlined; // Example specific icon
    case '.png':
      return Icons.image_outlined;
    case '.gif':
      return Icons.gif_box_outlined;
    case '.svg':
      return Icons.polyline_outlined; // For vector graphics
    case '.webp':
      return Icons.transform_outlined; // Generic for modern formats
    case '.ico':
      return Icons
          .emoji_emotions_outlined; // Favicons are often small, like emojis
    case '.bmp':
      return Icons.texture_outlined;
    case '.avif':
      return Icons.photo_filter_outlined;
    case '.tiff':
      return Icons.monochrome_photos_outlined;
    case '.unknown':
    case '.unknownData':
    case '.unknownDataError':
    case '.errorNonHttp':
    case '.errorProcessingUrl':
    case '.loopError':
      return Icons.help_outline; // Icon for unknown or error types
    default:
      return Icons.insert_drive_file_outlined; // Generic file icon
  }
}

//stateless widget just to display image details
class ImageDetailsCard extends StatelessWidget {
  final Map<String, ImageTypeDetail> imageDetails;

  const ImageDetailsCard({super.key, required this.imageDetails});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(
      context,
    ).textTheme; //get theme data from the widget tree
    const double leadingWidgetWidth = 100.0;
    //arrange children vertically
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Image Details:',
          style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8.0),
        if (imageDetails.isNotEmpty)
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Column(
                children: imageDetails.entries.map((entry) {
                  final String displayKey = entry.key
                      .replaceAll('.', '')
                      .toUpperCase();
                  final IconData iconData = _getIconForExtension(displayKey);
                  final String formattedSize = formatBytes(
                    entry.value.totalSize,
                  );
                  final String rawByteSize = "${entry.value.totalSize} bytes";
                  return ListTile(
                    leading: SizedBox(
                      width: leadingWidgetWidth,
                      child: Chip(
                        avatar: Icon(
                          // <--- ADDED AVATAR HERE
                          iconData,
                          size: 16, // Adjust icon size as needed
                          color: Theme.of(
                            context,
                          ).colorScheme.onSecondary, // Match label color
                        ),
                        label: Text(
                          entry.key.replaceAll('.', '').toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.onSecondary,
                          ),
                        ),
                        backgroundColor: Theme.of(
                          context,
                        ).colorScheme.secondary,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        labelPadding: EdgeInsets.zero,
                        visualDensity: VisualDensity.compact,
                      ),
                    ),
                    title: Text('Type: ${entry.key}'),
                    subtitle: Text(
                      'Count: ${entry.value.count}\n'
                      'Total Size: $formattedSize ($rawByteSize)',
                    ),
                    isThreeLine: true,
                  );
                }).toList(),
              ),
            ),
          )
        else
          const Text('   No image details found.'),
      ],
    );
  }
}
