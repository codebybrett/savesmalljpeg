# savesmalljpeg

**Save Small JPEG** is an Adobe Photoshop script for preset based exporting of small images.

It's a low fuss way to export Photoshop documents as Jpeg images according to specific pixel resolutions, sRGB colour space and maximum file size.

My original motivation (in 2008) was to use a preset based approach to exporting images for Camera Club members. Camera clubs will have competition requirements that images must meet for entry. Getting the requirements right is a fiddly and error prone process if one is not careful. This script automates that process.  SaveForWeb is an alternative, but is still awkward to get right.

Now that lightroom is here, many will have no need for this script because they can use the preset export approach in Lightroom.  But if you're a Photoshop user who just wants an easy regularly used way to export PSDs or other images to Jpeg this script has value.

## Features

* Export settings are stored as a named preset.
* Define multiple presets.
* Constrain images to fit within width and height.
* Exports as sRGB.
* Optional maximum file size, maximises quality while fitting in specified file size.
* Folder processing mode - for batch processing.
* Optional, subfolder destination templates.
* Optional photoshop actions.
* Optional Bruce Fraser sharpening steps.
* Optional scaling options for creating images suitable for supermarket printers.
* Preset file is a simplified XML file that could be distributed.
* Simple user interface.

Main processing workflow:  duplicate, flatten, resize, sharpening, scaling on canvas, convert to profile, convert to 8bit, save reducing quality until filesize achieved.

The default preset is set to make life easy for my camera club.
