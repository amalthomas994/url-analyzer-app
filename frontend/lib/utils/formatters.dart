import 'dart:math' as math;

//function to format bytes
String formatBytes(int bytes, {int decimals = 2}) {
  //bytes is a positional parameter, decimals is a named parameter
  if (bytes <= 0) {
    return "0 Bytes";
  }
  const suffixes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  int i;

  //find power of 1024 which best represents the bytes value. The power i corresponds to the index i in the suffixes array
  if (bytes == 0) {
    i = 0;
  } else {
    //1KB = 1024^1, 1 MB = 1024^2 ...
    i = (math.log(bytes) / math.log(1024)).floor();
  }
  if (i >= suffixes.length) {
    i = suffixes.length - 1;
  }
  //return human readable size
  return '${(bytes / math.pow(1024, i)).toStringAsFixed(decimals)} ${suffixes[i]}';
}
