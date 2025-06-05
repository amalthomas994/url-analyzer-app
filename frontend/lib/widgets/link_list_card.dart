import 'package:flutter/material.dart';

//Eidget to display a scrollable list of internal and external URLs
class LinkListCard extends StatelessWidget {
  final List<String> links;
  final bool isInternal; //check for if internal links
  final Function(String url) onLinkTap; //callback function to analyze new link
  final String title;

  const LinkListCard({
    super.key,
    required this.links,
    required this.isInternal,
    required this.onLinkTap,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    //arrange children vertically
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$title (${links.length}):', //example: Internal Links (4)
          style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8.0),
        if (links.isNotEmpty)
          Card(
            elevation: 1,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            child: Container(
              constraints: const BoxConstraints(maxHeight: 250),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: links.length,
                itemBuilder: (context, index) {
                  //callback function to build each item in the links list
                  final link = links[index];
                  return ListTile(
                    leading: Icon(
                      isInternal ? Icons.link : Icons.open_in_new,
                      size: 20,
                      color: Theme.of(context).colorScheme.secondary,
                    ),
                    title: Text(
                      link,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Colors.blueAccent,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    dense: true,
                    onTap: () => onLinkTap(link),
                    visualDensity: VisualDensity.compact,
                  );
                },
                separatorBuilder: (context, index) =>
                    const Divider(height: 0, indent: 16, endIndent: 16),
              ),
            ),
          )
        else
          Text('No $title found.'),
      ],
    );
  }
}
