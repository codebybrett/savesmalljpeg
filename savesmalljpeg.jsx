// ================================================================================
// Title: Save Small JPEG
//
// This script creates a version of the currently open image document according to named settings.
//
// This was my first Javascript script - it's pretty ugly on the inside and needs rewriting - but I don't have the time!
//
// ================================================================================

/*
    Copyright  (C)  Brett Handley,  All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.  Redistributions
in binary form must reproduce the above copyright notice, this list of
conditions and the following disclaimer in the documentation and/or
other materials provided with the distribution.  Neither the name of
the author nor the names of its contributors may be used to
endorse or promote products derived from this software without specific
prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.  
*/

// ================================================================================
//  Processing Modes
//
//         Processing Current Image Only
//
//              -  (Save location = Ask ) - you get prompted by SaveAs dialog.
//              -  (Save location = Original folder ) - you enter the name of the image.
//              -  (Save location = Specified folder ) - you enter the name of the image.
//
//         Processing Batch of images
//              -  Choose between Original folder or Specified folder.
//              -  You can choose between Original name or renaming option.
//
// ================================================================================
//
// TODO:
//
//   o   Fix bug introduced in 1.10 where progress bar is not being updated.
//   o   Add option to play macro before save.
//   o   Allow more work with dialog after cancelling processing due to Cancel on Confirm Replace.
//
// TODO - Lower Priority:
//
//   o   Refactor and simplify the code. Rearchitect this into contextual state based handling - because it is now too complex.
//        Original structure is obtuse, has implied state tests and needs rewritting. A legacy of it being my first javascript script.
//
//   o   Needs testing with different versions of Photoshop and behaviour on Mac.
//
// ================================================================================
//
// History:
//              6-Jul-2008 - Brett Handley - Initial version. Developed using Photoshop CS3. My first Javascript.
//  1.0    19-Jul-2008 - Brett Handley - release version - still not tested for Mac though.
//  1.01 24-Jul-2008 - Brett Handley. Bug fix - ruler units.
//  1.02 26-Jul-2008 - Brett Handley. Redo layout of Preset window using Auto layout. Tweek main dialog.
//  1.03 26-Jul-2008 - Brett Handley. Make menu item show as Save Small JPEG ..., Change name of save
//          button depending on mode, move ok button to right on Edit Preset if Macintosh.
//  1.04 29-Jul-2008 - Brett Handley. CS2 does not have File.changePath() method. Remove use of it.
//  1.05 6-Aug-2008 - Brett Handley. Fixed bug - next first wednesday in month was returning undefined on the actual day.
//  1.06                         Brett Handley. Remove dependence on XML class object (introduced in CS3) so
//           that it will work with CS2. Workarounds, fixes for other CS2 issues. Now works on CS2 and CS3.
//          Can't resolve in CS2 (probably CS2 bugs): preset dialog - alignment of buttons, ask radio button won't load correctly.
//  1.07 10-apr-2011 - Brett Handley. Fixed bug - didn't always get output size within maximum. Added explanation for why outputfile may not be deleted.
//  1.08 23-may-2011 - Brett Handley. Fixed bug - Was using activedocument.fullName property for unsaved files (compliesWithRequirements test) which raised error.
//                                    Open after save checkbox was invisible - CS5 must have changed window behaviour again... Put test for zero when overriding size with preferredsize.
//  1.09 23-may-2011 - Brett Handley. exportDocument (saveforweb) changes spaces to hypens on save - so the script was losing track of the newly created file and couldn't get a filesize. Change to hypens myself earlier.
//  1.10 11-jun-2012 - Brett Handley.
//                            Add subfolder option constants of 'thumbs', 'jpg', 'edi', 'smalljpeg' to give user some more flexibility with saving.
//                            Updated default NCP EDI and Gallery settings for latest values.
//                            Add scriptVersion to settings file.
//                            Ensure that original cannot be overwritten.
//                            Make folder option of saveBehaviour explict value of 'saveToSaveFolder' rather being empty string value. Empty string defaults to this option - so as to upgrade old installations.
//                            Fixed bug - was not properly filtering not photoshop files, Add indexAt method to Array prototype.
//                  Add saveBehaviour option saveToSourceFolder.
//                            Add reduction method option for resizing.
//                            Add inputOption ids - in case new processing modes are added later.
//                            Change index references in settings to symbols or instructions.
//                            Add document renaming option.
//                            Moved some photoshop stuff out of various places into PhotoshopTool object to neaten things up.
//                            Added beforeSaveBehaviour option - 3 levels of sharpening using Bruce Fraser's method.
//                            Fixed bug - Date.getMonth returning 0..11 was expection 1..12.
//  1.11 18-Aug-2013 - Brett Handley
//                            Add Extend image to max width and max height with black/white/gray/foreground colour.
//                            Add option to extend background.
//                            Add option to scale-and-offset
//                            Add option to rotate image for best fit.
//                            Add notes field.
//                            Dialog to select process folder now defaults at the current process folder or last processed folder.
//                            Dialog to select specific output folder now defaults to parent of last save folder.
//                            Tidy UI.
//  1.12 20-Aug-2013 - Brett Handley
//                            Add call to image and background actions.
//  1.13 21-Aug-2013 - Brett Handley
//                            Bug fix borders option.
//  1.14 14-Sep-2014 - Brett Handley
//                            Bug fix place on background option - when invalid option "none" can't save present. Fix by translating "none" to "place-black".
//                            Change default background option to "place-black".
//  1.15 15-Sep-2014 - Brett Handley
//                            Fix non-upgraded subfolderoption that prevents script from loading properly.
//                            Fix non-upgraded inputOption that prevents editing of preset.
//                            Modify Preset ui with tabbed panel to get more into smaller area.
//                            Renamed beforeSaveBehaviour to be postResizeSharpening.
//                            Added placementAction.
//                            Changed wording of border options.
//                            Added extract sharpening options.
//  1.16 23-Feb-2015 - Brett Handley
//                            Fix bug - was not accepting zero shift amounts.
//  1.17 07-Apr-2018 - Brett Handley
//                            Change default presets.
//  1.18 13-Apr-2018 - Brett Handley
//                            Fix bug where preset panel is off screen.
//                            Rename Edit  preset to Define.
//                            Move to GitHub.


// ================================================================================
// Target Photoshop / Photoshop menu behaviour for this script
// ================================================================================

// enable double clicking from the Macintosh Finder or the Windows Explorer
#target photoshop

/*
<javascriptresource>
<name>Save Small JPEG...</name>
<about>Save Small JPEG^r^rCopyright 2008 Brett Handley.^r^rThis script simplifies the process of making Jpegs to specific requirements.</about>
</javascriptresource>
*/

// in case we double clicked the file
bringToFront();

// ================================================================================
// Script Globals
// ================================================================================

        // This is a key created to be unique to this script. Used to store data in between script sessions.
        // Used with getCustomOptions
        // var scriptUUID = "c1025640-4ccf-11dd-ae16-0800200c9a66"

var scriptVersion = '1.19';

// Using a file to store data between sessions - hopefully will work with older versions.
var configDataFile = new File (app.preferencesFolder + './SaveSmallJpegSettings.xml');

// ---------------------------------------------------------------------

var gSubfolderOptionIds = [
    'none', 'today-yymm', 'today-yyyymm', 'today-yymmdd', 'today-yyyymmdd',
    'firstwed-yymm', 'firstwed-yyyymmdd',
     'const-jpg','const-edi', 'const-thumbs','const-prints','const-smalljpeg'
];

var gSubfolderOptionTxtList = [
    'None', 'yymm', 'yyyymm', 'yymmdd', 'yyyymmdd',
    'First Wednesday in month (yymm)', 'First Wednesday in month (yyyymmdd)',
     'jpg','edi', 'thumbs','prints','smalljpeg'
];

// ---------------------------------------------------------------------

var gInputOptionIds = ["currentImage", "allImagesInFolder"];

var gInputOptionTxtList = [
    'Process the current image only',
    'Process all images in a folder, save using the original name'
];


// ---------------------------------------------------------------------
// 1.11: Added ImageRotationOptions

var gImageRotationOptionsIds = [
    'none',
    'best-fit'
];

var gImageRotationOptionsTxtList = [
    'No rotation  (e.g. for web/screen/projected images)',
    'Rotate image for best fit  (e.g. for prints)'
];

// ---------------------------------------------------------------------
// 1.11: Added PlaceOnCanvasBehaviour

var gPlaceOnCanvasBehaviourIds = [
    'none',
    'borders-min',
    'scale-and-offset',
    'extend-maximum'
];

var gPlaceOnCanvasBehaviourTxtList = [
    'No borders, crop to resized image',
    'Image contained within borders ',
    'Image contained within percentage of available area with +/- pixel offset',
    'Image with possibly vertical or horizontal background bars showing'
];

// ---------------------------------------------------------------------
// 1.11: Added BackgroundOptions

var gBackgroundOptionsIds = [
    'place-black',
    'place-white',
    'place-gray',
    'place-foreground',
    'place-background'
];

var gBackgroundOptionsTxtList = [
    'Set on black',
    'Set on white',
    'Set on gray',
    'Set on foreground colour',
    'Set on background colour'
];

// ---------------------------------------------------------------------
// 1.10: Added BeforeSaveBehaviour
// 1.15: BeforeSaveBehaviour renamed to PostResizeSharpening.

var gPostResizeSharpeningIds = [
    'none',
    'sharpenForDigitalBFraser'
];

var gPostResizeSharpeningTxtList = [
    'No separate sharpening step',
    'Sharpen for digital (Bruce Fraser method)'
];

// ---------------------------------------------------------------------
// 1.10: Added namingBehaviour

var gNamingBehaviourIds = [
    'original',
    'suffixSmall',
    'suffixThumb',
    'prefixSmall',
    'prefixThumb'
];

var gNamingBehaviourTxtList = [
    'Use the original document name',
    'Add .small to the end of the original name',
    'Add .thumb to the end of the original name',
    'Add small. to the start of the original name',
    'Add thumb. to the start of the original name'
];

// ---------------------------------------------------------------------
// 1.10: Added resampling method.

var gDefaultReductionMethodOption;
var gReductionMethodOptionIds;
var gReductionMethodOptionTxtList;

if (7 < getVersion()) {
    gReductionMethodOptionIds = [
        'bicubicSharper',
        'bicubic',
        'bicubicSmoother'
    ];
    gReductionMethodOptionTxtList = [
        'Use Bicubic Sharper to resize (has a sharpening effect)',
        'Use Bicubic resampling to resize (the classic method)',
        'Use Bicubic Smoother to resize'
    ];
    gDefaultReductionMethodOption = 'bicubicSharper'; // ResampleMethod.BICUBICSHARPER
} else {
    gReductionMethodOptionIds = [
        'bicubic'
    ];
    gReductionMethodOptionTxtList = [
        'Bicubic resampling'
    ];
    gDefaultReductionMethodOption = 'bicubic'; // ResampleMethod.BICUBIC
}


// Add a function to Array to search for an element
Array.prototype.indexAt= function(x){
    var L=this.length;
     for(var i = 0; i < L; i++){ 
        if(this[i]=== x)
            return i;
    }
    return -1;
}

// Test for Numeric number.
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

// ================================================================================
// Photoshop Tool
// ================================================================================

function PhotoshopTool () {
 
    // --------------------------------------------------------------------------------
    // Photoshop user settings
    // --------------------------------------------------------------------------------

    this.saveSettings = function () {
        this.startRulerUnits = app.preferences.rulerUnits;
        this.startBackgroundColor = app.backgroundColor;
        this.startDisplayDialogs = app.displayDialogs;
    }

    this.restoreSettings = function () {
        app.preferences.rulerUnits = this.startRulerUnits;
        app.backgroundColor = this.startBackgroundColor;
        app.displayDialogs = this.startDisplayDialogs;
    }

    this.setPixelsBlackNoDialogs = function  () {

        app.preferences.rulerUnits = Units.PIXELS;
        app.displayDialogs = DialogModes.NO;

        var backColor = new SolidColor;
        backColor.hsb.hue = 0;
        backColor.hsb.saturation = 0;
        backColor.hsb.brightness = 0;
        app.backgroundColor = backColor; 

    }

    this.setDefaultSettings = function  () {
        app.preferences.rulerUnits = Units.PIXELS;
        app.displayDialogs = DialogModes.NO;
    }

    // --------------------------------------------------------------------------------
    // File handling
    // --------------------------------------------------------------------------------

    if ( File.fs == "Macintosh" )
        this.openableFileTypes = app.macintoshFileTypes
    else
        this.openableFileTypes = app.windowsFileTypes;

    this.isDocumentActive = function () {
        var result = true;
        try {app.activeDocument} // test if there is a document open
        catch (e) {
            result = false;
        };
        return result;
    }

    this.canOpenInPhotoshop = function (f) {
        var ext = getFileExtensionOrType(f);
        if (!ext) return false;
        return (0 <= this.openableFileTypes.indexAt(ext.toUpperCase()));
    }

    this.getOpenableFiles = function (folder) {
        var file;
        var allFiles = folder.getFiles();
        var result = new Array();
        for (var i=0; i<allFiles.length; i++) {
            file = allFiles[i];
            if (this.canOpenInPhotoshop(file))
                result[result.length] = file;
        };
        return result;
    }

    // --------------------------------------------------------------------------------
    // Calls SaveForWeb at a specific quality.
    // --------------------------------------------------------------------------------

    this.saveForWebAsJPEG = function (saveFile, jpegQuality) {

        // Saves the current image as a JPG using a quality setting.
        // You must check if the file exists and prompt the user yourself, because this
        // function will delete the file without prompting.
        //

        // Delete the file if it exists - to avoid the weird "replace?" prompt that "save for web" issues.
        if (saveFile.exists) {
            if (!saveFile.remove())
                throw "Could not delete the existing output file - another program may have locked it.  Ensure you do not have a program like Bridge monitoring the output directory, then retry.";
        }

        // Perform the SaveForWeb.
        var sfwOptions = new ExportOptionsSaveForWeb();  
        sfwOptions.format = SaveDocumentType.JPEG;  
        sfwOptions.includeProfile = true;  
        sfwOptions.interlaced = 0;  
        sfwOptions.optimized = true;  
        sfwOptions.quality = jpegQuality; 
        app.activeDocument.exportDocument(saveFile, ExportType.SAVEFORWEB, sfwOptions);
    };

    // --------------------------------------------------------------------------------
    // Save the image, repeatedly until it has achieved being just inside the max file size limit.
    // --------------------------------------------------------------------------------

    this.saveJPEGLimitFilesizeKb = function (saveFile, maxKb) {
        
        // Saves the image as a JPG within a maximum file size limit.
        // First cut is a simple algorithm that linearly adjusts quality.
        // To Do: Try to get number of saves down using a smarter algorithm like Binary search or perhaps Secant Iteration.
        
        fileLength = function (file) {
            // Returns the size of a file in bytes.
            var f = new File(unescape(file.toString()));
            var result = f.length;
            if (result < 0)
                throw "Cannot get the size of the newly created image.";
            return result;
        }

        var jpegQuality, optimumQuality;
        
        // If null maxKb just save as maximum quality.
        if (! maxKb) {
            this.saveForWebAsJPEG(saveFile, 100);
            return 100;
        }

        // Reduce quality relatively quickly until under limit.
        for (jpegQuality=100; jpegQuality >= 0; jpegQuality -= 5)  {
            this.saveForWebAsJPEG(saveFile, jpegQuality);
            if (fileLength(saveFile) <= 1024 * maxKb)
                break;
        };

        // Quit if maximum quality.
        if (jpegQuality == 100)
            return 100;

        // Throw error if still over limit even at minimum quality.
        if (fileLength(File(saveFile.fullName)) > 1024 * maxKb)
            throw "Image exceeds maximum filesize.";
                    
        // Optimise the quality by slowly increasing the quality again until it is too big.
        optimumQuality = jpegQuality;
        for ( ; jpegQuality < 100; jpegQuality += 1) {
            this.saveForWebAsJPEG(saveFile, jpegQuality);
            if (fileLength(saveFile) > 1024 * maxKb)
                break;
            optimumQuality = jpegQuality;
        };

        // Finally, write the file again at optimum quality.
        this.saveForWebAsJPEG(saveFile, optimumQuality);

        return optimumQuality;
    };


    // --------------------------------------------------------------------------------
    // My preferred sharpening for digital display.
    // Based on Bruce Fraser's book "Image Sharpening"
    // --------------------------------------------------------------------------------
    
    this.setBFShapeningBlendLayer-DigitalDisplay = function (layerOpacity) {
        
        // Set's Luminosity Blend with Opacity use 66.000000 for 66%.
        // Blend if sliders are set.
        // Recorded with ScriptListener - see Photoshop CS5 Scripting Guide.pdf
        
        var idsetd = charIDToTypeID( "setd" );
            var desc3 = new ActionDescriptor();
            var idnull = charIDToTypeID( "null" );
                var ref1 = new ActionReference();
                var idLyr = charIDToTypeID( "Lyr " );
                var idOrdn = charIDToTypeID( "Ordn" );
                var idTrgt = charIDToTypeID( "Trgt" );
                ref1.putEnumerated( idLyr, idOrdn, idTrgt );
            desc3.putReference( idnull, ref1 );
            var idT = charIDToTypeID( "T   " );
                var desc4 = new ActionDescriptor();            // Opacity
                var idOpct = charIDToTypeID( "Opct" );
                var idPrc = charIDToTypeID( "#Prc" );
                desc4.putUnitDouble( idOpct, idPrc, layerOpacity );
                var idMd = charIDToTypeID( "Md  " );
                var idBlnM = charIDToTypeID( "BlnM" );
                var idLmns = charIDToTypeID( "Lmns" );
                desc4.putEnumerated( idMd, idBlnM, idLmns );
                var idBlnd = charIDToTypeID( "Blnd" );
                    var list1 = new ActionList();
                        var desc5 = new ActionDescriptor();
                        var idChnl = charIDToTypeID( "Chnl" );
                            var ref2 = new ActionReference();
                            var idChnl = charIDToTypeID( "Chnl" );
                            var idChnl = charIDToTypeID( "Chnl" );
                            var idGry = charIDToTypeID( "Gry " );
                            ref2.putEnumerated( idChnl, idChnl, idGry );
                        desc5.putReference( idChnl, ref2 );
                        var idSrcB = charIDToTypeID( "SrcB" ); // This layer - Blendif Shadow Start
                        desc5.putInteger( idSrcB, 20 );
                        var idSrcl = charIDToTypeID( "Srcl" ); // This layer - Blendif Shadow Start
                        desc5.putInteger( idSrcl, 75 );
                        var idSrcW = charIDToTypeID( "SrcW" ); // This layer - Blendif Highlight Start
                        desc5.putInteger( idSrcW, 185 );
                        var idSrcm = charIDToTypeID( "Srcm" ); // This layer - Blendif Highlight End
                        desc5.putInteger( idSrcm, 235 );
                        var idDstB = charIDToTypeID( "DstB" ); // Underlying layer - Blendif Shadow Start
                        desc5.putInteger( idDstB, 20 );
                        var idDstl = charIDToTypeID( "Dstl" ); // Underlying layer - Blendif Shadow End
                        desc5.putInteger( idDstl, 75 );
                        var idDstW = charIDToTypeID( "DstW" ); // Underlying layer - Blendif Highlight Start
                        desc5.putInteger( idDstW, 185 );
                        var idDstt = charIDToTypeID( "Dstt" ); // Underlying layer - Blendif Highlight End
                        desc5.putInteger( idDstt, 235 );
                    var idBlnd = charIDToTypeID( "Blnd" );
                    list1.putObject( idBlnd, desc5 );
                desc4.putList( idBlnd, list1 );
                var idLefx = charIDToTypeID( "Lefx" );
                    var desc6 = new ActionDescriptor();
                    var idScl = charIDToTypeID( "Scl " );
                    var idPrc = charIDToTypeID( "#Prc" );
                    desc6.putUnitDouble( idScl, idPrc, 333.333333 );
                var idLefx = charIDToTypeID( "Lefx" );
                desc4.putObject( idLefx, idLefx, desc6 );
            var idLyr = charIDToTypeID( "Lyr " );
            desc3.putObject( idT, idLyr, desc4 );
        executeAction( idsetd, desc3, DialogModes.NO );
    }

    this.bruceFraserDigitalDisplaySharpeningBDH = function (opacity) {
        activeDocument.selection.selectAll();
        activeDocument.selection.copy(activeDocument.layers.length > 1); // Copy merged or copy if only one layer.
        activeDocument.selection.deselect();
        var layer = activeDocument.paste();
        layer.applyUnSharpMask(77, 1.2, 0) // Digital display
        this.setBFShapeningBlendLayer-DigitalDisplay(opacity);
        activeDocument.flatten();
    }


    // Modified from code found at: http://stackoverflow.com/questions/3672984/get-photoshops-action-list-using-objective-c
    this.getActionList = function () {
        
        var setCounter = 1;
        var actions = [];
        var actionSetName;
        var actn;

        gClassActionSet = charIDToTypeID( 'ASet' );
        gClassAction = charIDToTypeID( 'Actn' );
        gKeyName = charIDToTypeID( 'Nm  ' );
        gKeyNumberOfChildren = charIDToTypeID( 'NmbC' );

        while ( true )
        {
            var ref = new ActionReference();
            ref.putIndex( gClassActionSet, setCounter ); // Get ActionSet 1..n
            var desc = undefined;
            try { desc = executeActionGet( ref ); }
            catch( e ) { break; } // Run out of ActionSet
            actionSetName = desc.getString( gKeyName );

            var numberChildren = 0;
            if ( desc.hasKey( gKeyNumberOfChildren ) )
                numberChildren = desc.getInteger( gKeyNumberOfChildren );
            if ( numberChildren )
            {
//                   if(actionSetName == folderName)
                if(true)
                {
                    for ( var i = 1; i <= numberChildren; i++ )
                    {
                        var ref = new ActionReference();
                        ref.putIndex( gClassAction, i );  //  We want Action no 1..m
                        ref.putIndex( gClassActionSet, setCounter ); // of ActionSet no 1..n
                        var desc = undefined;
                        desc = executeActionGet( ref );
                        if( desc.hasKey( gKeyName ) )
                        {
                            actn = new Object();
                            actn.actionSetName = actionSetName;
                            actn.actionName = desc.getString( gKeyName );
                            actn.id = ("action: " + actn.actionName + " actionSet: " + actn.actionSetName);
                            actn.text = ("[" + actn.actionSetName + "] " + actn.actionName );
                            actions.push(actn);
                        }
                    }
//                         break;
                }
            }
            setCounter++;
        }
        return actions;
    }

}

// ================================================================================
// Settings Object
// ================================================================================

function Settings () {

// Default XML string used on first use of the script.
// TODO If this XML structure is changed, add a version number to represent the data format at that time,
// and include code in getConfiguration/loadXML to upgrade original settings files.

    this.defaultXmlStr = "\
    <saveJpegSettings>\
        <scriptVersion>" + scriptVersion + "</scriptVersion>\
        <currentPreset>0</currentPreset>\
        <afterSaveBehaviour></afterSaveBehaviour>\
        <preset>\
                <name>Northside Creative Photography - EDI Competition</name>\
                <colourProfileName>sRGB IEC61966-2.1</colourProfileName>\
                <maxWidthPx>1920</maxWidthPx>\
                <maxHeightPx>1080</maxHeightPx>\
                <maxFilesizeKb>2000</maxFilesizeKb>\
                <smallImageCheck>warn</smallImageCheck>\
                <presetNotes></presetNotes>\
                <inputOption>currentImage</inputOption>\
                <reductionMethodOption>bicubicSharper</reductionMethodOption>\
                <namingBehaviour>original</namingBehaviour>\
                <imageRotationOptions>none</imageRotationOptions>\
                <placeOnCanvasBehaviour>none</placeOnCanvasBehaviour>\
                <backgroundOptions>place-black</backgroundOptions>\
                <postResizeSharpening>none</postResizeSharpening>\
                <postResizeSharpeningOpt></postResizeSharpeningOpt>\
                <imageActionOneSet>none</imageActionOneSet>\
                <imageActionOneName>none</imageActionOneName>\
                <placementActionSet>none</placementActionSet>\
                <placementActionName>none</placementActionName>\
                <backgroundActionLastSet>none</backgroundActionLastSet>\
                <backgroundActionLastName>none</backgroundActionLastName>\
                <saveBehaviour>ask</saveBehaviour>\
                  <canvasOpt1></canvasOpt1>\
                  <canvasOpt2></canvasOpt2>\
                  <canvasOpt3></canvasOpt3>\
                  <canvasOpt4></canvasOpt4>\
                  <saveFolder></saveFolder>\
                <subFolderOption>none</subFolderOption>\
        </preset>\
    </saveJpegSettings>";

    // CS2 doesn't have XML object, so do our own basic saving/loading of simplified XML settings.
    // Better to have a generic solution, but for now let's just get it working.

    this.formXML = function () {
        var xmlPresets = "";
        for (var i=0; i < this.userData.preset.length; i++) {
            var preset = this.userData.preset[i];
            var xmlPreset = "";
            for (var property in preset)
                xmlPreset += "\n\t\t" + this.formXmlElt (property, preset[property])
            xmlPresets += "\n\t" + this.formXmlElt("preset", xmlPreset);
        };
        var xmlString = "\n\t" + this.formXmlElt("scriptVersion", this.userData.scriptVersion)
                  + "\n\t" + this.formXmlElt("currentPreset", this.userData.currentPreset)
                + "\n\t" + this.formXmlElt("afterSaveBehaviour", this.userData.afterSaveBehaviour)
                + "\n\t" + this.formXmlElt("lastProcessed", this.userData.lastProcessed)
                + "\n\t" + this.formXmlElt("lastSaveFolder", this.userData.lastSaveFolder)
                + xmlPresets;
        return this.formXmlElt("saveJpegSettings", xmlString);
    };

    this.formXmlElt = function (name, value) {  return "<" + name + ">" + value + "</" + name + ">" };

    this.loadXML = function (string) {
        
        // Custom XML load here.
                
        var xmlSettings = this.loadXmlElt(string, "saveJpegSettings")
        
        var data = new Object();
         data.scriptVersion =  this.loadXmlElt(xmlSettings , "scriptVersion",  "1.09"); //1.10: 1.09 was last version before scriptVersion was introduced.

        // 1.15: Change of element name.
        var postResizeSharpeningElementName = "postResizeSharpening"
        if (data.scriptVersion < "1.15") {
            postResizeSharpeningElementName = "beforeSaveBehaviour"
        };

        data.currentPreset = this.loadXmlElt(xmlSettings , "currentPreset");
        data.afterSaveBehaviour = this.loadXmlElt(xmlSettings , "afterSaveBehaviour");
        data.lastProcessed = this.loadXmlElt(xmlSettings , "lastProcessed");
        data.lastSaveFolder = this.loadXmlElt(xmlSettings , "lastSaveFolder");
        data.preset = new Array();
        var rest = string;
        var presetElt = this.findXmlElt (rest, "preset");
        while (presetElt) {
            var presetXML = rest.slice(presetElt.valueStart, presetElt.valueEnd);
            var preset = new Object();
            data.preset[data.preset.length] = preset;
            preset.name = this.loadXmlElt(presetXML, "name");
            preset.colourProfileName = this.loadXmlElt(presetXML, "colourProfileName");
            preset.maxWidthPx = this.loadXmlElt(presetXML, "maxWidthPx");
            preset.maxHeightPx = this.loadXmlElt(presetXML, "maxHeightPx");
            preset.maxFilesizeKb = this.loadXmlElt(presetXML, "maxFilesizeKb");
            preset.smallImageCheck = this.loadXmlElt(presetXML, "smallImageCheck");
            preset.presetNotes = this.loadXmlElt(presetXML, "presetNotes","");
            preset.inputOption = this.loadXmlElt(presetXML, "inputOption", "currentImage");
            preset.reductionMethodOption = this.loadXmlElt(presetXML, "reductionMethodOption", gDefaultReductionMethodOption);
            preset.namingBehaviour = this.loadXmlElt(presetXML, "namingBehaviour", "original");
            preset.imageRotationOptions = this.loadXmlElt(presetXML, "imageRotationOptions", "none");
            preset.placeOnCanvasBehaviour = this.loadXmlElt(presetXML, "placeOnCanvasBehaviour", "none");
            preset.backgroundOptions = this.loadXmlElt(presetXML, "backgroundOptions", "place-black");            
            preset.postResizeSharpening = this.loadXmlElt(presetXML, postResizeSharpeningElementName, "none");
            preset.postResizeSharpeningOpt = this.loadXmlElt(presetXML, "postResizeSharpeningOpt", "10");
            preset.imageActionOneSet = this.loadXmlElt(presetXML, "imageActionOneSet", "none");
            preset.imageActionOneName = this.loadXmlElt(presetXML, "imageActionOneName", "none");
            preset.placementActionSet = this.loadXmlElt(presetXML, "placementActionSet", "none");
            preset.placementActionName= this.loadXmlElt(presetXML, "placementActionName", "none");
            preset.backgroundActionLastSet = this.loadXmlElt(presetXML, "backgroundActionLastSet", "none");
            preset.backgroundActionLastName = this.loadXmlElt(presetXML, "backgroundActionLastName", "none");
            preset.saveBehaviour = this.loadXmlElt(presetXML, "saveBehaviour", "saveToSaveFolder");
            preset.canvasOpt1 = this.loadXmlElt(presetXML, "canvasOpt1","");
            preset.canvasOpt2 = this.loadXmlElt(presetXML, "canvasOpt2","");
            preset.canvasOpt3 = this.loadXmlElt(presetXML, "canvasOpt3","");
            preset.canvasOpt4 = this.loadXmlElt(presetXML, "canvasOpt4","");
            preset.saveFolder = this.loadXmlElt(presetXML, "saveFolder");
            preset.subFolderOption = this.loadXmlElt(presetXML, "subFolderOption","none");
            rest = rest.substr(presetElt.eltEnd);
            presetElt = this.findXmlElt (rest, "preset");
        };
    
        // 1.10: Upgrade earlier setting files.
        //  scriptVersion was introduced in 1.10
        if (data.scriptVersion < "1.10") {
            var gOldSubfolderOptions = [
                'none', 'today-yymm', 'today-yyyymm', 'today-yymmdd', 'today-yyyymmdd',
                'firstwed-yymm', 'firstwed-yyyymmdd'
            ];
            for (var i=0; i < data.preset.length; i++) {
                var preset = data.preset[i];
                preset.inputOption = (preset.inputOption == 0) ? "currentImage" : "allImagesInFolder"; // 1.10: 1.09 Used index number to option list.
                if (!preset.saveBehaviour) preset.saveBehaviour = "saveToSaveFolder"; // 1.10: 1.09 and earlier had null to indicate save to folder option. Will get upgraded.
                preset.reductionMethodOption = gDefaultReductionMethodOption; // 1.10: Introduced this setting.
                preset.namingBehaviour = "original"; // 1.10: Introduced this setting.
                preset.postResizeSharpening = "none"; // 1.10: Introduced this setting.
                preset.subFolderOption = gOldSubfolderOptions[Number(preset.subFolderOption)]; // 1.10: 1.09 used index numbers into subfolder option list - change to symbols.
            };
        };
    
        // 1.11: Upgrade earlier setting files.
        if (data.scriptVersion < "1.11") {
            for (var i=0; i < data.preset.length; i++) {
                var preset = data.preset[i];
                preset.imageRotationOptions = "none"; // 1.11: Introduced this setting.
                preset.placeOnCanvasBehaviour = "none"; // 1.11: Introduced this setting.
                preset.backgroundOptions = "place-black"; // 1.11: Introduced this setting.
                preset.canvasOpt1 = ""; // 1.11: Introduced this setting.
                preset.canvasOpt2 = ""; // 1.11: Introduced this setting.
                preset.canvasOpt3 = ""; // 1.11: Introduced this setting.
                preset.canvasOpt4 = ""; // 1.11: Introduced this setting.
                preset.presetNotes = ""; // 1.11: Introduced this setting.
            };
        };
        
        // 1.12: Upgrade earlier setting files.
        if (data.scriptVersion < "1.12") {
            for (var i=0; i < data.preset.length; i++) {
                var preset = data.preset[i];
                preset.imageActionOneSet = "none"; // 1.12: Introduced this setting.
                preset.imageActionOneName = "none"; // 1.12: Introduced this setting.
                preset.backgroundActionLastSet = "none"; // 1.12: Introduced this setting.
                preset.backgroundActionLastName = "none"; // 1.12: Introduced this setting.
            };
        };
    
        // 1.14: Upgrade earlier setting files.
        if (data.scriptVersion < "1.14") {
            for (var i=0; i < data.preset.length; i++) {
                var preset = data.preset[i];
                // 1.14: Convert background option to "none" to "place-black" to fix bug.
                if (preset.backgroundOptions = "none") {
                    preset.backgroundOptions = "place-black";
                };
            };
        };
   
        // 1.15: Upgrade earlier setting files.
        if (data.scriptVersion < "1.15") {
            var gOldSubfolderOptions = [
                'none', 'today-yymm', 'today-yyyymm', 'today-yymmdd', 'today-yyyymmdd',
                'firstwed-yymm', 'firstwed-yyyymmdd'
            ];
            for (var i=0; i < data.preset.length; i++) {
                var preset = data.preset[i];
               // 1.09 used index numbers into subfolder option list, 1.10 was supposed to have upgraded these, but missed some somehow. Try again.
                if (isNumeric(preset.subFolderOption)) {
                    preset.subFolderOption = gOldSubfolderOptions[Number(preset.subFolderOption)];
                };
               // 1.09 used index numbers into inputOption list, 1.10 was supposed to have upgraded these, but missed some somehow. Try again.
                if (isNumeric(preset.inputOption)) {
                    preset.inputOption = gInputOptionIds[Number(preset.inputOption)];
                };
               // Introduced placementAction.
                preset.placementActionSet = "none"; // 1.15 Introduced this setting.
                preset.placementActionName = "none"; // 1.15: Introduced this setting.
               // Introduced postResizeSharpeningOpt and removed fixed opacity options.
               // Removed fixed opacity options.
               switch (preset.postResizeSharpening) {
                case "sharpenForDigital-10":
                    preset.postResizeSharpening = "sharpenForDigitalBFraser"
                    preset.postResizeSharpeningOpt = "10";
                    break;
                case "sharpenForDigital-30":
                    preset.postResizeSharpening = "sharpenForDigitalBFraser"
                    preset.postResizeSharpeningOpt = "30";
                    break;
                case "sharpenForDigital-50":
                    preset.postResizeSharpening = "sharpenForDigitalBFraser"
                    preset.postResizeSharpeningOpt = "50";
                    break;
                default:
                    preset.postResizeSharpeningOpt = "";
               };
            };
        };

        return data;
    };
    
    this.findXmlElt = function (string, name) {
        var startTag = "<" + name + ">";
        var endTag = "</" + name + ">";
        var a = string.search(startTag);
        var b = string.search(endTag);
        if (( a < 0) || (b < 0)) return null;
        var result = new Object();
        result.eltStart = a;
        result.valueStart = a + startTag.length;
        result.valueEnd = b;
        result.eltEnd = b + endTag.length;
        return result;
    };

    this.loadXmlElt = function (string, name, defaultValue) {
        // Searches for the element returns the value.
        var elt = this.findXmlElt (string, name);
        var result;
        if (elt) result =string.slice( elt.valueStart, elt.valueEnd)
        else {
            if ("undefined" == typeof defaultValue) defaultValue = null;
            result = defaultValue;
        };
        return result;
    };

    this.getConfiguration = function () {
        // Returns the stored configuration settings, or default settings.
        // If you add more options, then you will need to deal with missing elements from configurations already stored on user's computers.
        var xmlStr;
        try {
            var fileIsOpen = configDataFile.open('r')
            if (configDataFile.error != "") throw configDataFile.error;
            xmlStr = configDataFile.read();
        }
        catch (e) {
            xmlStr = this.defaultXmlStr;
        }
        finally {
            if (fileIsOpen) configDataFile.close()
        }
        this.userData = this.loadXML(xmlStr);
    };

    this.putConfiguration = function () {

        // Save configuration settings for next run.
        try {
             this.userData.scriptVersion = scriptVersion;
            var xml = this.formXML();
            var fileIsOpen = configDataFile.open('w')
            if (configDataFile.error != "") throw configDataFile.error;
            configDataFile.write(xml);
        }
        catch (e) {
            // Not going to worry about lost settings at the moment.
        }
        finally {
            if (fileIsOpen) configDataFile.close()
        }
    };

    this.insertPreset = function (newPreset) {
        var insertPosition;
        var presetArray = this.userData.preset;
        for (insertPosition=0; insertPosition < presetArray.length ; insertPosition++) {
            if (presetArray[insertPosition].name > newPreset.name) 
                break;
        };
        presetArray.splice(insertPosition, 0, newPreset);
        this.userData.currentPreset = insertPosition;
    };

    this.deletePreset = function (index) {
        this.userData.preset.splice(index,1); // Remove preset from array.
        if (this.userData.currentPreset >= this.userData.preset.length )
            this.userData.currentPreset = this.userData.preset.length - 1;
    }

}


// ================================================================================
// User Interface - Main Dialog
// Build and show the main dialog box.
// Handles all events on the dialog.
// ================================================================================

function showUiMain (runOptions, settings) {

    // --------------------------------------------------------------------------------
    // Resource specification.
    // --------------------------------------------------------------------------------

    var uiMain =
        "dialog{text:'Save Small JPEG ',bounds:[100,100,770,300],\
            \
            st1:StaticText{bounds:[15,22,60,42] , text:'For:'},\
            ddPreset:DropDownList{bounds:[70,20,570,42], \
                helpTip: 'Choose a preset to determine how the image will be saved.',\
                properties:{readonly:true}, \
            },\
            btnDefinePreset:Button{bounds:[585,20,660,40] , text:'Define' , helpTip: 'Define the settings for this preset, or a new preset based on this one.'},\
            stDescription:StaticText{bounds:[74,46,570,66] , text:''  ,properties:{readonly:true}, helpTip: 'Description of settings to use.'},\
            \
            stName:StaticText{bounds:[15,80,60,100] , text:'Name:' },\
            stProcess:StaticText{bounds:[15,80,60,100] , text:'Process:' },\
            etName:EditText{bounds:[70,80,570,100] , text:'' , helpTip: 'Enter the name for this image.'},\
            etInputFolder:EditText{bounds:[70,80,570,100] , visible:false; text:'' ,properties:{readonly:true}, helpTip: 'The images located here will be processed.'},\
            btnBrowseForFolder:Button{bounds:[585,80,660,100] , text:'Browse...' , helpTip: 'Browse for a folder to process.'},\
            stFolderDisplay:StaticText{bounds:[70,105,570,125] , text:''  ,properties:{readonly:true}, helpTip:'Your image will be stored here.'},\
            \
            cbOpenAfterSave:Checkbox{bounds:[70,150,300,171] , text:'open the new image after saving it', helpTip: 'Opens the image in Photoshop after it has been saved.' },\
            saveBtn:Button{bounds:[380,150,480,170] , active: true, text:'Save now', helpTip: 'Duplicates, flattens, converts, resizes, and then saves it to disk.' },\
            doneBtn:Button{bounds:[495,150,570,170] , text:'Done' , helpTip: 'Saves your setting changes then closes the script without creating an image.'}\
        }";


    // --------------------------------------------------------------------------------
    // Window object variable
    // --------------------------------------------------------------------------------

    var win = new Window (uiMain);

    // --------------------------------------------------------------------------------
    // Workaround layout problems and position the window.
    // --------------------------------------------------------------------------------
    
    win.adjustLayout = function () {
        // Using bounds object in the resource spec for the window can lead to problems on
        // different platforms I've discovered. This is a quick workaround for this problem.
        //
        var lblSpace = 10;
        var stOffset = 1;

        // Make sure statictext and checkbox have appropriate size for font.
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            if ( ((child.type == "statictext") || (child.type == "checkbox")) && (child.text != "")) {
                 if ((child.preferredSize[0] > 0) && (child.preferredSize[1] > 0))
                    child.size = child.preferredSize;
            }
        };

        // Layout the other controls in reference to the drop down list box at the top.
        this.st1.location.y = this.ddPreset.location.y + stOffset;
        this.st1.location.x = this.ddPreset.location.x - lblSpace - this.st1.size.width;
        this.stName.location.y = this.etName.location.y + stOffset;
        this.stName.location.x = this.etName.location.x - lblSpace - this.stName.size.width;
        this.stProcess.location.y = this.etName.location.y + stOffset;
        this.stProcess.location.x = this.etName.location.x - lblSpace - this.stProcess.size.width;
    }
    win.adjustLayout();

    win.text = win.text + ' ' + scriptVersion;
    win.center ()

    // For CS3 and greater, make the positioning nicer
    if (getVersion() >= 10) {
        win.frameLocation.x = win.frameLocation.x * 0.4;
        win.frameLocation.y = win.frameLocation.y * 0.3;
    };

    // --------------------------------------------------------------------------------
    // Keeps window text and parameters in sync with preset choice.
    // --------------------------------------------------------------------------------

    win.updateParameters = function  () {

        // Using the currently selected preset...
        var preset = this.settings.userData.preset[this.ddPreset.selection.index]

        // Update the description text on the window.
        var tmpTxt = preset.maxWidthPx + "x" + preset.maxHeightPx + " pixels " 
            + "8bit \'" + preset.colourProfileName + "\'";
        if (preset.maxFilesizeKb != "")
            tmpTxt = tmpTxt + " (filesize " + preset.maxFilesizeKb + "Kb max.)"
        else
            tmpTxt = tmpTxt + " (maximum quality)";
        this.stDescription.text = tmpTxt;

        // Set the image parameters according to the current Preset.
        this.runOptions.imageParameters = new Object();
        this.runOptions.imageParameters.width = new UnitValue(preset.maxWidthPx + " pixels") ;
        this.runOptions.imageParameters.height = new UnitValue(preset.maxHeightPx + "pixels");
        this.runOptions.imageParameters.reductionMethod = preset.reductionMethodOption;
        this.runOptions.imageParameters.namingBehaviour = preset.namingBehaviour;
        this.runOptions.imageParameters.imageRotationOptions = preset.imageRotationOptions;
        this.runOptions.imageParameters.placeOnCanvasBehaviour = preset.placeOnCanvasBehaviour;
        this.runOptions.imageParameters.backgroundOptions = preset.backgroundOptions;
        this.runOptions.imageParameters.canvasOpt1 = preset.canvasOpt1;
        this.runOptions.imageParameters.canvasOpt2 = preset.canvasOpt2;
        this.runOptions.imageParameters.canvasOpt3 = preset.canvasOpt3;
        this.runOptions.imageParameters.canvasOpt4 = preset.canvasOpt4;
        this.runOptions.imageParameters.postResizeSharpening = preset.postResizeSharpening;
        this.runOptions.imageParameters.postResizeSharpeningOpt = preset.postResizeSharpeningOpt;
        this.runOptions.imageParameters.imageActionOneSet = preset.imageActionOneSet;
        this.runOptions.imageParameters.imageActionOneName = preset.imageActionOneName;
        this.runOptions.imageParameters.placementActionSet = preset.placementActionSet;
        this.runOptions.imageParameters.placementActionName = preset.placementActionName;
        this.runOptions.imageParameters.backgroundActionLastSet = preset.backgroundActionLastSet;
        this.runOptions.imageParameters.backgroundActionLastName = preset.backgroundActionLastName;
        this.runOptions.imageParameters.colourProfile = preset.colourProfileName.toString();
        if (preset.maxFilesizeKb == "")
            this.runOptions.imageParameters.maxFilesizekb = null
        else
            this.runOptions.imageParameters.maxFilesizekb = Number(preset.maxFilesizeKb);
        this.runOptions.imageParameters.smallImageWarning = (preset.smallImageCheck == "warn");

    };

    // --------------------------------------------------------------------------------
    // Calculates the save folder and sets window text specific to the file options selected.
    // --------------------------------------------------------------------------------
    
    win.updateFileOptions = function () {

        var today = new Date();
        var dayInMilliseconds = (24*60*60*1000);
        var theNextFirstWednesdayInMonth = function () {
            targetDate = today;
            for (var x=today; ((x.getDay() != 3) || ((x.getDate() - 7 ) > 0)); x.setTime(x.getTime() + dayInMilliseconds)) {
                var targetDate = x;
            };
            return targetDate;
        }
        var formatDate = function (date, format) {
            var yyyy = function () {return date.getFullYear()};
            var yy = function() {var x; if ( (x=date.getYear() - 100 ) < 10) x = "0" + x; return x;}
            var mm = function() {var x; if ( (x=(1 + date.getMonth()) ) < 10) x = "0" + x; return x;}
            var dd = function() {var x; if ( (x=date.getDate() )  < 10) x = "0" + x; return x;}
            switch (format) {
                case "yyyymmdd":
                    return "" + yyyy() + mm() + dd();
                    break;
                case "yymmdd":
                    return "" + yy() + mm() + dd();
                    break;
                case "yyyymm":
                    return "" + yyyy() + mm();
                    break;
                case "yymm":
                    return "" + yy() + mm();
                    break;
                default:
                    throw "Encountered an invalid date format: " + format;
            };
        };

        // Using the currently selected preset...
        var preset = this.settings.userData.preset[this.ddPreset.selection.index]
        var currentImageOnly = (preset.inputOption == "currentImage");
        var savingToSourceFolder = (preset.saveBehaviour == "saveToSourceFolder")
        var locationTxt;

        // Updating this here, because we use the folder that was displayed to the user.
        this.runOptions.saveFolder = null;
        this.etInputFolder.visible = false;
        this.etName.visible = false;

        if ("ask" == preset.saveBehaviour) {
            
              // ---------------------------------
              // Prompt for save location
              
            this.etName.text = "";
            this.saveBtn.text = "Save As..."
            this.allowOk = function () {
                return (psTool.isDocumentActive())
            };
            locationTxt = "You will be prompted to choose a folder and enter an image name.";
            
        } else {
            
               // ---------------------------------
               // Save to a Folder

                //  Set options according to processing mode.
                if (currentImageOnly) {
                    
                    //  Single image mode.
                    this.etName.visible = true;
                    this.saveBtn.text = "Save"
                    this.allowOk = function () {
                        return (
                            (psTool.isDocumentActive())
                            && (this.etName.text != "")
                        )
                    };  // Allow ok once a name has been input.
                    
                } else {
                    
                    //  Batch image mode.
                    this.etInputFolder.visible = true;
                    this.saveBtn.text = "Run"
                    this.allowOk = function () {
                        return (this.etInputFolder.text != "")
                    };  // Allow Ok once processing folder is specified.
                
                };

                // Calculate subfolder.

                var subfolderTxt = '';
                switch (preset.subFolderOption) {
                    case "none":
                        break;
                    case "const-edi":
                    case "const-jpg":
                    case "const-prints":
                    case "const-thumbs":
                    case "const-smalljpeg":
                        subfolderTxt = gSubfolderOptionTxtList[gSubfolderOptionIds.indexAt(preset.subFolderOption)];
                        break;
                    case "firstwed-yymm":
                        var theDate = theNextFirstWednesdayInMonth();
                        subfolderTxt = formatDate(theDate, "yymm");
                        break;
                    case "firstwed-yyyymmdd":
                        var theDate = theNextFirstWednesdayInMonth();
                        subfolderTxt = formatDate(theDate, "yyyymmdd");
                        break;
                    default:
                        subfolderTxt = formatDate(today, gSubfolderOptionTxtList[gSubfolderOptionIds.indexAt(preset.subFolderOption)]);
                };
            
                // Saving to a folder - curent image or batch?
                // Saving to the same folder as original or to a specified folder?
                
                // Set ultimateSaveFolder only if we have some specification.
                var ultimateSaveFolder = null;
                if (savingToSourceFolder) {
                    
                    if (currentImageOnly) {
                            // In current image mode we have the folder if the document is open and previously saved.
                            var documentIsOpen = false;
                            try {
                                app.activeDocument; // Testing to see if the current image is open.
                                ultimateSaveFolder = new Folder (app.activeDocument.path+ "./" + subfolderTxt);
                                documentIsOpen = true;
                            } catch (e) {}
                    } else {
                            // In batch mode - we will have the folder only if the process folder has been specified.
                            if (this.etInputFolder.text != '')
                                ultimateSaveFolder = new Folder(this.etInputFolder.text+ "./" + subfolderTxt);
                    }
                
                } else {
                    
                    // We should have a folder specified already in our preset.
                    ultimateSaveFolder = new Folder(preset.saveFolder+ "./" + subfolderTxt)
                    
                };

                // Set the text that describes the folder location

                if (savingToSourceFolder  && !ultimateSaveFolder)
                    if (subfolderTxt == '')
                        locationTxt = " the same folder as the original image."
                    else
                        locationTxt = " subfolder: " + subfolderTxt
                else
                    locationTxt = ": " + ultimateSaveFolder.fsName;

                if (currentImageOnly)
                    locationTxt = 'Saving in' + locationTxt
                else
                    if (preset.namingBehaviour == "original")
                        locationTxt =  'Saving in' + locationTxt
                    else
                        locationTxt = 'Rename, save in' + locationTxt;
               
               this.runOptions.saveFolder = ultimateSaveFolder;
            
         };
        this.stName.visible = this.etName.visible;
        this.stProcess.visible = this.etInputFolder.visible;
        this.cbOpenAfterSave.visible = !this.etInputFolder.visible;
        this.btnBrowseForFolder.visible = this.etInputFolder.visible;
        this.stFolderDisplay.text = locationTxt;
        this.handleMsg({type: "Check Ok"})
    };

    // --------------------------------------------------------------------------------
    //  Refresh everything on the main dialog.
    // --------------------------------------------------------------------------------
    
    win.refreshUiMain = function () {
        // Loads the controls in the window with values and event handlers.
        //

        // Disable the onChange event while we play with the ddlbox.
        this.ddPreset.onChange = null;

        // Load the window with the settings information.
        this.ddPreset.removeAll()
        for (var i=0; i < this.settings.userData.preset.length; i++) 
            win.ddPreset.add('item', this.settings.userData.preset[i].name);
        var newIndex = Number(this.settings.userData.currentPreset);
        this.ddPreset.selection = newIndex; // Had some odd behaviour during development hence the newIndex variable to allow "time" for ddl to update.

        this.updateParameters();
        this.updateFileOptions();


        this.cbOpenAfterSave.value = (this.settings.userData.afterSaveBehaviour == "open")

        // Set the handler for the preset ddlbox.
        this.ddPreset.onChange = function () {
            this.parent.handleMsg({type: "Preset changed", value: this.selection.index})
        };

    };

    // --------------------------------------------------------------------------------
    // Store user settings made on the main dialog.
    // --------------------------------------------------------------------------------
    
    win.saveSettings = function () {
        // Save settings of this dialog.
        var currentIndex = Number(this.ddPreset.selection.index);
        this.settings.userData.currentPreset = currentIndex;
        var preset = this.settings.userData.preset[currentIndex];
        if (this.cbOpenAfterSave.value)
            this.settings.userData.afterSaveBehaviour = "open"
        else
            this.settings.userData.afterSaveBehaviour = "";
        this.runOptions.inputOption = preset.inputOption;
        if (this.settings.userData.preset[currentIndex].inputOption == "currentImage")
            this.runOptions.inputName = this.etName.text
        else
            this.runOptions.inputName = this.etInputFolder.text;
        this.runOptions.openAfterSave = this.cbOpenAfterSave.value;
    };

    // --------------------------------------------------------------------------------
    // Create Event handlers for the other dialog controls
    // --------------------------------------------------------------------------------
    
    win.etName.onChanging = function () {
        this.parent.handleMsg({type: "Check Ok"}) 
    };
    win.btnDefinePreset.onClick = function () {
        this.parent.handleMsg({type: "Define preset"}) 
    };
    win.saveBtn.onClick = function () {
        this.parent.handleMsg({type: "Save"});
    };
    win.doneBtn.onClick = function () {
        this.parent.handleMsg({type: "Done"});
    };
    win.btnBrowseForFolder.onClick = function () {
        this.parent.handleMsg({type: "Select folder"});
    };

    // --------------------------------------------------------------------------------
    // Common Event handler for the dialog
    // --------------------------------------------------------------------------------
    
    win.handleMsg = function (msg) {
        // Receives messages from child controls.
        // I like to keep window level logic at the window level rather than in a button say.
        //
        switch (msg.type) {

            case "Save":
                this.close(1);
                break;
    
            case "Done":
                this.close(0);
                break;
    
            case "Check Ok":
                this.saveBtn.enabled = this.allowOk();
                break;

            case "Preset changed":
    
                this.settings.userData.currentPreset = msg.value;
                this.updateParameters();
                this.updateFileOptions();
                break;

            case "Define preset":

                var currentIndex = this.ddPreset.selection.index;
                var preset = this.settings.userData.preset[currentIndex];

                // Clone the preset
                var presetToEdit = new Object();
                for(var i in preset)
                    presetToEdit[i] = preset[i];

                var allowPresetDelete = (1 < this.settings.userData.preset.length);
                var uiPresetResult = showUiPreset(this, presetToEdit, allowPresetDelete);
                switch (uiPresetResult) {
                    case -1: // Delete Preset
                        this.settings.deletePreset(this.ddPreset.selection.index);
                        break;
                    case 1: // Preset modified
                        if (preset.name == presetToEdit.name)
                            // Same name, update existing preset.
                            this.settings.userData.preset[currentIndex] = presetToEdit;
                        else {
                            // Different name, create new preset - alphabetical order.
                            this.settings.insertPreset(presetToEdit);
                        };
                        break;
                };
                this.refreshUiMain();
                break;

            case "Select folder":
                  var startFolder;
                  if (this.etInputFolder.text == "") {
                      startFolder = Folder(settings.userData.lastProcessed);
                      // startFolder.changePath('..');  // Start dialog at parent folder next run?
                  } else {
                      startFolder = Folder(this.etInputFolder.text);
                  };
                var usrFolder = startFolder.selectDlg ("Choose the folder to be processed:");
                if (usrFolder) {
                    this.etInputFolder.text = usrFolder.fsName;
                      this.updateFileOptions(); //1.10: Added so as to set the save to description correctly.
                    //1.10: Commented out because updateFileOptions calls Check Ok.:  this.handleMsg({type: "Check Ok"}) ;
                };
                break;
            
        };
    };

    // Window reference to settings.
    win.runOptions = runOptions;
    win.settings = settings;

     // Refresh the dialog.
    win.refreshUiMain ();

     // Show the dialog - returns when user has finished with it.
    var dialogResult = win.show();

    // Modify our settings every time OK is clicked.
    win.saveSettings();

    return dialogResult;
};

// ================================================================================
// User Interface - Save As dialog.
// ================================================================================
    
function promptForJpgSaveFile (prompt) {
    
    // Prompt user with SaveAs style prompt, ensuring JPG extension.
    
    var saveFile;
    
    if ( File.fs == "Windows" ) {
        saveFile = File.saveDialog( prompt, "*.jpg" );
    } else {
        saveFile = File.saveDialog( prompt, MacJpgFilter );
    }
    if (! saveFile)
        return null;

    if (!hasJpgExtension(saveFile))
        saveFile = new File (saveFile + ".jpg");
        
    return saveFile;
};

// ================================================================================
// User Interface - Preset Dialog
// Handles everthing related to the preset dialog.
// ================================================================================

function showUiPreset (mainWindow, preset, allowPresetDelete) {
    
    // --------------------------------------------------------------------------------
    // Preset dialog resource string
    // --------------------------------------------------------------------------------
    
    // Some StaticText have a text of "<size>" set so layout assigns a reasonable width.

    var uiPreset = // dialog resource object
        "dialog { \
            text: 'Define Preset',\
            orientation: 'column',\
            alignChildren: 'fill',\
            gName: Group {\
                orientation: 'row', \
                stName: StaticText{text:'Preset name:'},\
                etPresetName: EditText{properties: {name: 'uiPresetName'}, characters: 50, text:'', helpTip: 'Enter the name for this preset.'}\
            },\
            gImageSettings: Panel { \
                text:'Requirements:',\
                orientation: 'column',\
                alignChildren: 'fill',\
                margins: 15,\
                ddlInputOption:DropDownList{properties: {name: 'uiInputOption'}, helpTip: 'This determines what images are processed, a single open image, or multiple images in a folder.'},\
                g0: Group { \
                     orientation: 'row',\
                    alignChildren: 'fill',\
                    g0: Group {\
                        size: [180,25],\
                        alignChildren: ['right','center'],\
                        statictext1:StaticText{text:'Max. width (pixels):'},\
                        etMaxWidthPx:EditText{ properties: {name: 'uiMaxWidthPx'}, characters: 5, text:'1024' , helpTip: 'The image will be scaled to fit within this limit.'}\
                    },\
                    g1: Group {\
                        size: [180,25],\
                        alignChildren: ['right','center'],\
                        statictext2:StaticText{text:'Max. height (pixels):' },\
                        etMaxHeightPx:EditText{ properties: {name: 'uiMaxHeightPx'}, characters: 5, text:'768' , helpTip: 'The image will be scaled to fit within this limit.'}\
                    },\
                    g2: Group {\
                        alignChildren: ['right','center'],\
                        stProfile:StaticText{text:'Profile:' },\
                        etProfile:EditText{ properties: {name: 'uiColourProfile', readonly:true}, characters: 25, text:'sRGB IEC61966-2.1' , helpTip: 'ICC Colour space to convert to.'}\
                    }\
                },\
                g1: Group { \
                    orientation: 'row',\
                    alignChildren: 'fill',\
                    g0: Group {\
                        size: [180,20],\
                        alignChildren: ['right','center'],\
                        statictext3:StaticText{text:'Max. filesize (Kb):' },\
                        etMaxFilesizeKb:EditText{ properties: {name: 'uiMaxFilesizeKb'}, characters: 5, text:'' , helpTip: 'Repeatedly save the file at reducing quality until the file is less than or equal to this limit.'}\
                    },\
                    statictext4:StaticText{text:'(blank = maximum quality)' },\
                    cbSmallImageWarning:Checkbox{\
                        properties: {name: 'uiSmallImageWarning'}, \
                        alignment: ['right','center'],\
                        text:'Warn if image is too small',\
                        helpTip: 'Warns you if your image is smaller than both the maximum height and maximum width.'\
                    }\
                },\
                g1: Group {\
                    orientation: 'row',\
                    alignChildren: 'fill',\
                    statictext1:StaticText{ text:'Note:' },\
                    etPresetNotes:EditText{ properties: {name: 'uiPresetNotes'}, characters: 80, text:'' , helpTip: 'Enter any notes you would like to make about this preset.'}\
                }\
                stRepetitionWarning:StaticText{properties: {name: 'uiSaveRepeatWarning'}, justify: 'center', text:'Every file will be saved repeatedly to achieve maximum quality within filesize.' }\
            },\
            gImageOptionsPnl: Panel { \
                type: 'tabbedpanel',\
                alignChildren: 'fill',\
                gImagePreparationTab: Panel {\
                    type: 'tab',\
                    text: 'Preparation',\
                    orientation: 'column',\
                    alignChildren: 'fill',\
                    margins: 15,\
                    ddlimageActionOne:DropDownList{properties: {name: 'uiImageActionOne'}, helpTip: 'You can choose to run a photoshop action.'}\
                },\
                gImageReductionTab: Panel {\
                    type: 'tab',\
                    text: 'Resizing',\
                    orientation: 'column',\
                    alignChildren: 'fill',\
                    margins: 15,\
                    ddlImageRotationOptions:DropDownList{properties: {name: 'uiImageRotationOptions'}, helpTip: 'Options for rotating the image.'},\
                    ddlReductionMethodOption:DropDownList{properties: {name: 'uiReductionMethodOption'}, helpTip: 'The method used to resize the image. Photoshop describes Bicubic Sharper as best for reduction, but it sharpens too much for my taste. I prefer Bicubic with a separate sharpening step.'},\
                    gSharpeningOptions: Group { \
                        orientation: 'row',\
                        alignChildren: 'fill',\
                        ddlpostResizeSharpening:DropDownList{properties: {name: 'uiPostResizeSharpening'}, helpTip: 'What to do just before saving.'},\
                        g0: Group {\
                            alignChildren: ['right','center'],\
                            statictext1:StaticText{ properties: {name: 'uiPostResizeSharpeningOptTxt'}, characters: 6, justify: 'right', text:'opacity:' },\
                            etCanvasOpt1:EditText{ properties: {name: 'uiPostResizeSharpeningOpt'}, characters: 5, text:''}\
                        }\
                    }\
                },\
                gPresentationOptionsTab: Panel { \
                    type: 'tab',\
                    text: 'Presentation',\
                    orientation: 'column',\
                    alignChildren: 'fill',\
                    margins: 15,\
                    ddlPlacementAction:DropDownList{properties: {name: 'uiplacementAction'}, helpTip: 'You can choose to run a photoshop action.'},\
                    ddlPlaceOnCanvasBehaviour:DropDownList{properties: {name: 'uiPlaceOnCanvasBehaviour'}, helpTip: 'Canvas options.'},\
                    gCanvasOptions: Group { \
                        orientation: 'row',\
                        alignChildren: 'fill',\
                        ddlBackgroundOptions:DropDownList{properties: {name: 'uiBackgroundOptions'}, helpTip: 'Background options.'},\
                        g0: Group {\
                            alignChildren: ['right','center'],\
                            statictext1:StaticText{ properties: {name: 'uiCanvasOpt1Txt'}, justify: 'right', text:'<size>' },\
                            etCanvasOpt1:EditText{ properties: {name: 'uiCanvasOpt1'}, characters: 5, text:''}\
                        },\
                        g1: Group {\
                            alignChildren: ['right','center'],\
                            statictext1:StaticText{ properties: {name: 'uiCanvasOpt2Txt'}, justify: 'right', text:'<size>' },\
                            etCanvasOpt2:EditText{ properties: {name: 'uiCanvasOpt2'}, characters: 5, text:''}\
                        },\
                        g2: Group {\
                            alignChildren: ['right','center'],\
                            statictext1:StaticText{ properties: {name: 'uiCanvasOpt3Txt'}, justify: 'right', text:'<size>' },\
                            etCanvasOpt3:EditText{ properties: {name: 'uiCanvasOpt3'}, characters: 5, text:''}\
                        },\
                        g3: Group {\
                            alignChildren: ['right','center'],\
                            statictext1:StaticText{ properties: {name: 'uiCanvasOpt4Txt'}, justify: 'right', text:'<size>' },\
                            etCanvasOpt4:EditText{ properties: {name: 'uiCanvasOpt4'}, characters: 5, text:''}\
                        }\
                    },\
                },\
                gImageLastlyTab: Panel {\
                    type: 'tab',\
                    text: 'Finally',\
                    orientation: 'column',\
                    alignChildren: 'fill',\
                    margins: 15,\
                    ddlbackgroundActionLast:DropDownList{properties: {name: 'uibackgroundActionLast'}, helpTip: 'You can choose to run a photoshop action.'},\
                },\
            },\
            gOutputMode: Panel { \
                text: 'Where to save?',\
                orientation: 'column', \
                alignChildren: 'fill',\
                g0: Group { \
                    orientation: 'row', \
                    alignment: 'left', \
                    margins: 5,\
                    g0: Group { \
                        orientation: 'column',\
                        alignment: 'left', \
                        alignChildren: 'left', \
                        rbAskOnSave:RadioButton{properties: {name: 'uiAskOnSaveOption'}, text:'Ask before saving.', helpTip: 'You will be prompted with a normal SaveAs style prompt.'},\
                        rbSaveToSourceFolder:RadioButton{properties: {name: 'uiSaveToSourceFolderOption'}, text:'Original folder.', helpTip: 'Files are saved to the same folder as the original or optionally a subfolder of that.'},\
                        rbInFolder:RadioButton{properties: {name: 'uiSaveInFolderOption'}, text:'This folder:' , helpTip: 'Always use your choosen folder.'}\
                    },\
                    btnBrowseForFolder:Button{properties: {name: 'uiBrowseForFolder'}, alignment: ['right','bottom'], text:'Choose folder...' , helpTip: 'Browse for a folder.'}\
                }\
                 etSaveFolder:EditText{properties: {name: 'uiSaveFolder', readonly:true},  text:'' , helpTip: 'The images will be stored here. ~ indicates your home folder.'},\
                 g0: Group { \
                   orientation: 'row', \
                   alignment: 'left', \
                     alignChildren: ['right','center'],\
                     stSubfolder:StaticText{ properties: {name: 'uiSubfolderOptionTxt'}, text:'Subfolder:' },\
                     ddlSubfolderOption:DropDownList{properties: {name: 'uiSubfolderOption'}, helpTip: 'Creates a subfolder of your selected folder.'}\
                 },\
                 ddlNamingBehaviour:DropDownList{properties: {name: 'uiNamingBehaviour'}, helpTip: 'Determines how the new JPG will be named.'}\
            },\
            stChooseSaveOption:StaticText{ properties: {name: 'uiChooseSaveOptionTxt'}, justify: 'right', text:'' },\
            gBtns: Group { \
                orientation: 'row', \
                alignChildren: 'fill', \
                delBtn:Button{properties: {name: 'uiDelBtn'}, text:'Remove preset permanently' , helpTip: 'Permanently remove/delete this preset.'},\
                **put buttons here**\
            }\
        }";

    var sButtons;
    if (File.fs == "Macintosh" )
        sButtons = "cancelBtn:Button{properties: {name: 'uiCancelBtn'}, alignment: ['right','center'], text:'Cancel' , helpTip: 'Cancel your changes to this preset.'},\
                okBtn:Button{properties: {name: 'uiOkBtn'}, alignment: ['right','center'], text:'Ok', helpTip: 'Save the Preset as shown.' }"
    else
        sButtons = "okBtn:Button{properties: {name: 'uiOkBtn'}, alignment:['right','center'], text:'Ok', helpTip: 'Save the Preset as shown.' },\
                cancelBtn:Button{properties: {name: 'uiCancelBtn'}, alignment:['right','center'], text:'Cancel' , helpTip: 'Cancel your changes to this preset.'}"  ;
    uiPreset = uiPreset.replace ("**put buttons here**", sButtons);
    
    // --------------------------------------------------------------------------------
    // Preset dialog window object
    // Build and load the dialog.
    // --------------------------------------------------------------------------------
    
    var win = new Window (uiPreset);
    
    var ui = new Object();
    addControlsToObject (win, ui);
    
    // Select resizing tab initially.
    win.gImageOptionsPnl.selection = win.gImageOptionsPnl.gImageReductionTab
    
    for (var i=0; i < gInputOptionTxtList.length; i++)
        ui.uiInputOption.add('item',gInputOptionTxtList[i]);
    for (var i=0; i < gActionOptions.length; i++)
        ui.uiImageActionOne.add('item',gActionOptions[i].text);
    for (var i=0; i < gActionOptions.length; i++)
        ui.uiplacementAction.add('item',gActionOptions[i].text);
    for (var i=0; i < gActionOptions.length; i++)
        ui.uibackgroundActionLast.add('item',gActionOptions[i].text);
    for (var i=0; i < gReductionMethodOptionTxtList.length; i++)
        ui.uiReductionMethodOption.add('item',gReductionMethodOptionTxtList[i]);
    for (var i=0; i < gNamingBehaviourTxtList.length; i++)
        ui.uiNamingBehaviour.add('item',gNamingBehaviourTxtList[i]);
    for (var i=0; i < gImageRotationOptionsTxtList.length; i++)
        ui.uiImageRotationOptions.add('item',gImageRotationOptionsTxtList[i]);
    for (var i=0; i < gPlaceOnCanvasBehaviourTxtList.length; i++)
        ui.uiPlaceOnCanvasBehaviour.add('item',gPlaceOnCanvasBehaviourTxtList[i]);
    for (var i=0; i < gBackgroundOptionsTxtList.length; i++)
        ui.uiBackgroundOptions.add('item',gBackgroundOptionsTxtList[i]);
    for (var i=0; i < gPostResizeSharpeningTxtList.length; i++)
        ui.uiPostResizeSharpening.add('item',gPostResizeSharpeningTxtList[i]);
    for (var i=0; i < gSubfolderOptionTxtList.length; i++)
        ui.uiSubfolderOption.add('item',gSubfolderOptionTxtList[i]);

    // --------------------------------------------------------------------------------
    // Preset dialog event handlers
    // --------------------------------------------------------------------------------
    
    // Handlers
    ui.uiAskOnSaveOption.onClick = function () {
        win.handleMsg({type: "Check Ok"}) };
    ui.uiSaveToSourceFolderOption.onClick = function ()  { // 1.10: Added this option.
        win.handleMsg({type: "Check Ok"}) };
    ui.uiSaveInFolderOption.onClick = function () {
        win.handleMsg({type: "Check Ok"}) };
    ui.uiBrowseForFolder.onClick = function () {
        win.handleMsg({type: "Select folder"});
        win.handleMsg({type: "Check Ok"});
    };
    ui.uiPresetName.onChanging = function () {
        win.handleMsg({type: "Check Ok"})
     };
    ui.uiInputOption.onChange = function () {
        win.handleMsg({type: "Check save behaviour option"});
        win.handleMsg({type: "Check Ok"});
    };
    ui.uiReductionMethodOption.onChange = function () {
        win.handleMsg({type: "Check Ok"});
    };
    ui.uiNamingBehaviour.onChange = function () {
        win.handleMsg({type: "Check Ok"});
    };
    ui.uiPlaceOnCanvasBehaviour.onChange = function () {
        win.handleMsg({type: "Check presentation options"});
        win.handleMsg({type: "Check Ok"});
    };
    ui.uiPostResizeSharpening.onChange = function () {
        win.handleMsg({type: "Check presentation options"});
        win.handleMsg({type: "Check Ok"});
    };
    ui.uiMaxWidthPx.onChanging = function () {
        win.handleMsg({type: "Check Ok"}) };
    ui.uiMaxHeightPx.onChanging = function () {
        win.handleMsg({type: "Check Ok"}) };
    ui.uiMaxFilesizeKb.onChanging = function () {
        win.handleMsg({type: "Check Ok"}) };
    ui.uiDelBtn.onClick = function () {
        win.handleMsg({type: "Delete"}) };
    
    ui.uiPostResizeSharpeningOpt.onChanging = function () {
        win.handleMsg({type: "Check Ok"}) };

    ui.uiCanvasOpt1.onChanging = function () {
        win.handleMsg({type: "Check Ok"}) };
    ui.uiCanvasOpt2.onChanging = function () {
        win.handleMsg({type: "Check Ok"}) };
    ui.uiCanvasOpt3.onChanging = function () {
        win.handleMsg({type: "Check Ok"}) };
    ui.uiCanvasOpt4.onChanging = function () {
        win.handleMsg({type: "Check Ok"}) };
    
    
    

    // --------------------------------------------------------------------------------
    // Preset dialog common event handler
    // --------------------------------------------------------------------------------
    
    // NOTE: Preset changes will not be saved when a silent exception occurs (possibly due to an invalid value).
    
    win.handleMsg = function (msg) {
        // Receives messages from child controls.
        // I like to keep window level logic at the window level.
        //

        var currentImageOnly = (gInputOptionIds[ui.uiInputOption.selection.index] == "currentImage")
        
        switch (msg.type) {

            case "Check Ok":

                ui.uiSaveRepeatWarning.visible = ((Number(ui.uiMaxFilesizeKb.text)) && (!currentImageOnly));
                ui.uiSaveFolder.visible = (ui.uiSaveInFolderOption.value);
                ui.uiSubfolderOptionTxt.visible = ui.uiSubfolderOption.visible = (! ui.uiAskOnSaveOption.value);

                // Positively state the requirements that must be met for the preset
                // and report those requirements not met.
                // This means requirements both become visible to the user and the
                // messages serve as documentation for the script.
                var errors = null;
                var validate = function (condition, desc) {
                    if (!condition) {
                        if (!errors) {errors = desc}
                    }
                };

                validate(
                    (
                        (ui.uiPresetName.text.indexOf("<") < 0)
                        && (ui.uiPresetName.text.indexOf(">") < 0)
                    ),
                    "Name must not contain < or >."
                );

                validate(
                    (ui.uiMaxWidthPx.text != ""),
                    "Width required."
                );

                validate(
                    (Number(ui.uiMaxWidthPx.text)),
                    "Width must be a whole number of pixels."
                );
                validate(
                    (ui.uiMaxHeightPx.text != ""),
                    "Height required."
                );

                validate(
                    (Number(ui.uiMaxHeightPx.text)),
                    "Height must be a whole number of pixels."
                );

                validate(
                    (
                        (ui.uiMaxFilesizeKb.text == "")
                        || (Number(ui.uiMaxFilesizeKb.text))
                    ),
                    "Maximum filesize must be a whole number of kilobytes or blank.");

                validate(
                    (
                        ui.uiAskOnSaveOption.value
                        || ui.uiSaveToSourceFolderOption.value
                        || ui.uiSaveInFolderOption.value
                    ),
                    "An option for where to save must be specified."
                );

                if (ui.uiSaveInFolderOption.value)
                    validate(
                        (ui.uiSaveFolder.text != ""),
                        "A folder to save to must be specified.");
                
                if (
                    ui.uiPostResizeSharpening.selection
                    == gPostResizeSharpeningIds.indexAt("sharpenForDigitalBFraser")
                ) {
                    validate(
                        (
                            (ui.uiPostResizeSharpeningOpt.text != "")
                            && (
                                (1 <= Number(ui.uiPostResizeSharpeningOpt.text))
                                && (100 >= Number(ui.uiPostResizeSharpeningOpt.text))
                            )
                        ),
                        "Opacity of 1 to 100 required for Bruce Fraser digital sharpening step."
                    );
                };

                if (ui.uiPlaceOnCanvasBehaviour.selection == gPlaceOnCanvasBehaviourIds.indexAt('borders-min')) {
                    validate(
                        (0 <= Number(ui.uiCanvasOpt1.text)),
                        "Top border is specified by number of pixels."
                    );
                    validate(
                        (0 <= Number(ui.uiCanvasOpt2.text)),
                        "Bottom border is specified by number of pixels."
                    );
                    validate(
                        (0 <= Number(ui.uiCanvasOpt3.text)),
                        "Left border is specified by number of pixels."
                    );
                    validate(
                        (0 <= Number(ui.uiCanvasOpt4.text)),
                        "Right border is specified by number of pixels."
                    );
                };

                if (ui.uiPlaceOnCanvasBehaviour.selection == gPlaceOnCanvasBehaviourIds.indexAt('scale-and-offset')) {
                    validate(
                        (0 <= Number(ui.uiCanvasOpt1.text)),
                        "Scaling factor must be a percentage."
                    );
                    validate(
                        (0 <= Number(ui.uiCanvasOpt2.text)),
                        "Horizontal shift must be a positive or negative number."
                    );
                    validate(
                        (0 <= Number(ui.uiCanvasOpt3.text)),
                        "Vertical shift must be a positive or negative number."
                    );
                };
                            
                ui.uiChooseSaveOptionTxt.visible = (errors != null)
                ui.uiChooseSaveOptionTxt.text = errors
                ui.uiOkBtn.enabled = (!errors);

                break;

            case "Check save behaviour option":
                ui.uiAskOnSaveOption.enabled = (currentImageOnly);
                // ui.uiSaveInFolderOption.value = true;
                ui.uiAskOnSaveOption.value = false;
                ui.uiNamingBehaviour.visible = (!currentImageOnly)
                if (currentImageOnly)
                    ui.uiNamingBehaviour.selection = gNamingBehaviourIds.indexAt("original"); // Reset to original naming.
                break;

            case "Check presentation options":
                ui.uiPostResizeSharpeningOptTxt.visible = ui.uiPostResizeSharpeningOpt.visible = (gPostResizeSharpeningIds[ui.uiPostResizeSharpening.selection.index] == "sharpenForDigitalBFraser")
                ui.uiBackgroundOptions.visible = (gPlaceOnCanvasBehaviourIds[ui.uiPlaceOnCanvasBehaviour.selection.index] != 'none');
                ui.uiCanvasOpt4Txt.visible = ui.uiCanvasOpt4.visible = (gPlaceOnCanvasBehaviourIds[ui.uiPlaceOnCanvasBehaviour.selection.index] == 'borders-min');
                ui.uiCanvasOpt3Txt.visible = ui.uiCanvasOpt3.visible = (ui.uiCanvasOpt4.visible || gPlaceOnCanvasBehaviourIds[ui.uiPlaceOnCanvasBehaviour.selection.index] == 'scale-and-offset');
                ui.uiCanvasOpt2Txt.visible = ui.uiCanvasOpt2.visible = (ui.uiCanvasOpt4.visible || ui.uiCanvasOpt3.visible);
                ui.uiCanvasOpt1Txt.visible = ui.uiCanvasOpt1.visible = (ui.uiCanvasOpt2.visible);
                  switch (gPlaceOnCanvasBehaviourIds[ui.uiPlaceOnCanvasBehaviour.selection.index]) {
                        case 'borders-min':
                            ui.uiCanvasOpt1Txt.text = "Top";
                            ui.uiCanvasOpt2Txt.text = "Bottom";
                            ui.uiCanvasOpt3Txt.text = "Left";
                            ui.uiCanvasOpt4Txt.text = "Right";
                            break;
                        case 'scale-and-offset':
                            ui.uiCanvasOpt1Txt.text = "Scale%";
                            ui.uiCanvasOpt2Txt.text = "x-shift";
                            ui.uiCanvasOpt3Txt.text = "y-shift";
                            break;
                        default:
                            break;
                  };
                
                break;

            case "Select folder":
                  var startFolder;
                  startFolder = Folder(settings.userData.lastSaveFolder);
                  startFolder.changePath("..");
                var usrFolder = startFolder.selectDlg ("Choose a folder to store your images:");
                if (usrFolder) {
                    ui.uiSaveInFolderOption.value = true;
                    ui.uiSaveFolder.text = usrFolder.fullName;
                };
                break;

            case "Delete":
                this.close(-1);
                break;

        };
    };

    // Load up the window
    
    ui.uiPresetName.text = preset.name;
    ui.uiColourProfile.text = preset.colourProfileName;
    ui.uiMaxWidthPx.text = preset.maxWidthPx;
    ui.uiMaxHeightPx.text = preset.maxHeightPx;
    ui.uiMaxFilesizeKb.text = preset.maxFilesizeKb;
    ui.uiSmallImageWarning.value = (preset.smallImageCheck == "warn");
    ui.uiPresetNotes.text = preset.presetNotes;
    ui.uiInputOption.selection = (preset.inputOption == "currentImage") ? 0 : 1;
    ui.uiImageActionOne.selection = gActionIds.indexAt("action: " + preset.imageActionOneName + " actionSet: " + preset.imageActionOneSet);
    ui.uiplacementAction.selection = gActionIds.indexAt("action: " + preset.placementActionName + " actionSet: " + preset.placementActionSet);
    ui.uibackgroundActionLast.selection = gActionIds.indexAt("action: " + preset.backgroundActionLastName + " actionSet: " + preset.backgroundActionLastSet);
    ui.uiReductionMethodOption.selection = gReductionMethodOptionIds.indexAt(preset.reductionMethodOption);
    ui.uiNamingBehaviour.selection = gNamingBehaviourIds.indexAt(preset.namingBehaviour);
    ui.uiImageRotationOptions.selection = gImageRotationOptionsIds.indexAt(preset.imageRotationOptions);
    ui.uiPlaceOnCanvasBehaviour.selection = gPlaceOnCanvasBehaviourIds.indexAt(preset.placeOnCanvasBehaviour);
    ui.uiBackgroundOptions.selection = gBackgroundOptionsIds.indexAt(preset.backgroundOptions);
    ui.uiCanvasOpt1.text = preset.canvasOpt1;
    ui.uiCanvasOpt2.text = preset.canvasOpt2;
    ui.uiCanvasOpt3.text = preset.canvasOpt3;
    ui.uiCanvasOpt4.text = preset.canvasOpt4;
    ui.uiPostResizeSharpening.selection = gPostResizeSharpeningIds.indexAt(preset.postResizeSharpening);
    ui.uiPostResizeSharpeningOpt.text = preset.postResizeSharpeningOpt;

    // 1.10: Add option to save to source folder.
    
    switch (preset.saveBehaviour)  {
        case "ask":
            ui.uiAskOnSaveOption.value = true; break;
        case "saveToSourceFolder":
            ui.uiSaveToSourceFolderOption.value = true; break;
        case "saveToSaveFolder":
            ui.uiSaveInFolderOption.value = true; break;
    };

    ui.uiSaveFolder.text = preset.saveFolder;
    ui.uiSubfolderOption.selection = gSubfolderOptionIds.indexAt(preset.subFolderOption);
    ui.uiDelBtn.enabled = allowPresetDelete;
    win.handleMsg({type: "Check Ok"});


    // Display the dialog - returns when ok or cancel is clicked.

    // Determine placement of window.
    // 1.18: Creating a location object prevents window showing off screen.
    win.location = [80, 100]; // Ensure locatoin is created (prevent's showing off screen).

    var ret = win.show();


    // Modifiy the settings if Ok.
    
    if (1==ret) {
        
        if ((ui.uiSaveFolder.text == "")  &&  (ui.uiSaveInFolderOption.value))
            ui.uiAskOnSaveOption.value = true;
            
        preset.name = ui.uiPresetName.text;
        preset.colourProfileName =ui.uiColourProfile.text;
        preset.maxWidthPx = ui.uiMaxWidthPx.text;
        preset.maxHeightPx =ui.uiMaxHeightPx.text;
        preset.maxFilesizeKb = ui.uiMaxFilesizeKb.text;
        preset.presetNotes = ui.uiPresetNotes.text;
        preset.inputOption = gInputOptionIds[ui.uiInputOption.selection.index];
        preset.imageActionOneSet = gActionOptions[ui.uiImageActionOne.selection.index].actionSetName;
        preset.imageActionOneName = gActionOptions[ui.uiImageActionOne.selection.index].actionName;
        preset.placementActionSet = gActionOptions[ui.uiplacementAction.selection.index].actionSetName;
        preset.placementActionName = gActionOptions[ui.uiplacementAction.selection.index].actionName;
        preset.backgroundActionLastSet = gActionOptions[ui.uibackgroundActionLast.selection.index].actionSetName;
        preset.backgroundActionLastName = gActionOptions[ui.uibackgroundActionLast.selection.index].actionName;
        preset.reductionMethodOption = gReductionMethodOptionIds[ui.uiReductionMethodOption.selection.index];
        preset.namingBehaviour = gNamingBehaviourIds[ui.uiNamingBehaviour.selection.index];
        preset.imageRotationOptions = gImageRotationOptionsIds[ui.uiImageRotationOptions.selection.index];
        preset.placeOnCanvasBehaviour = gPlaceOnCanvasBehaviourIds[ui.uiPlaceOnCanvasBehaviour.selection.index];
        preset.backgroundOptions = gBackgroundOptionsIds[ui.uiBackgroundOptions.selection.index];
        preset.postResizeSharpening = gPostResizeSharpeningIds[ui.uiPostResizeSharpening.selection.index];
        preset.postResizeSharpeningOpt = ui.uiPostResizeSharpeningOpt.text;
        if (ui.uiSmallImageWarning.value)
            preset.smallImageCheck = "warn"
        else
            preset.smallImageCheck = "";
        if (ui.uiAskOnSaveOption.value) {
            preset.saveBehaviour = "ask";
            ui.uiSaveFolder.text = "";
            ui.uiSubfolderOption.selection = gSubfolderOptionTxtList.indexAt("none");
        } else
                if (ui.uiSaveToSourceFolderOption.value) {
                    ui.uiSaveFolder.text = "";
                    preset.saveBehaviour = "saveToSourceFolder"; // 1.10: Add this option explicit in the settings.
                } else
                    preset.saveBehaviour = "saveToSaveFolder"; // 1.10: Made this option explicit in the settings.

         if (   (ui.uiPlaceOnCanvasBehaviour.selection == gPlaceOnCanvasBehaviourIds.indexAt('none'))
                || (ui.uiPlaceOnCanvasBehaviour.selection == gPlaceOnCanvasBehaviourIds.indexAt('extend-maximum'))
            ) {
            ui.uiCanvasOpt1.text = "";
            ui.uiCanvasOpt2.text = "";
            ui.uiCanvasOpt3.text = "";
         };
         if (ui.uiPlaceOnCanvasBehaviour.selection != gPlaceOnCanvasBehaviourIds.indexAt('borders-min')) {
            ui.uiCanvasOpt4.text = "";
         };
         preset.canvasOpt1 = ui.uiCanvasOpt1.text;
         preset.canvasOpt2 = ui.uiCanvasOpt2.text;
         preset.canvasOpt3 = ui.uiCanvasOpt3.text;
         preset.canvasOpt4 = ui.uiCanvasOpt4.text;

        preset.subFolderOption = gSubfolderOptionIds[ui.uiSubfolderOption.selection.index];
        preset.saveFolder =ui.uiSaveFolder.text;
    };

    return ret
   
};

// ================================================================================
// User Interface Other Functions
// ================================================================================


// --------------------------------------------------------------------------------
// Create a function to search the dialog recursively to find a control by name.
// --------------------------------------------------------------------------------

function findControlByName (control, name) {
    var result, tmp;
    for (var i = 0; i < control.children.length; i++) {
        var child = control.children[i];
        if ((child.properties) && (child.properties.name == name)) {
            result = child;
            break;
        }
        else {
            if (typeof child.layout != "undefined") {
                var tmp=findControlByName(child,name);
                if (tmp) {
                    result = tmp;
                    break;
                };
            }
        };
    }
    return result;
};

// --------------------------------------------------------------------------------
// Index all the dialog's controls.
// --------------------------------------------------------------------------------
    
function addControlsToObject (control, object) {
    
    // Function creates a new object by using the name property of controls.
    // Names should be unique.
    // This avoids dealing with the nesting of controls.
    
    for (var i = 0; i < control.children.length; i++) {
        var child = control.children[i];
        if ((child.properties) && (child.properties.name)) {
            object[child.properties.name] = child;
        }
        if (child.children.length > 0)
            addControlsToObject(child, object);
    };
};


// ================================================================================
// Misc Functions
// ================================================================================

function isSupportedInThisVersion () {
    // Determines if this script is expected to work under this version of Photoshop.
    // Modify as other versions are tested.
    //
    return (getVersion() >= 8);
};

function getVersion() {
    // Return the version of Photoshop;
    //
    return parseInt(app.version);
}

function hasJpgExtension (f) {
    var jpgExtension = ".jpg";
    var lCaseName = f.name;
    lCaseName = lCaseName.toLowerCase();
    return ( lCaseName.lastIndexOf( jpgExtension ) == f.name.length - jpgExtension.length )
};

function getFileExtensionOrType (f) {
    // Get file extension as string - not sure if there is a better way to do this.
    if ( File.fs == "Macintosh" )
        return f.type
    else {
        var lCaseName = f.name;
        lCaseName = lCaseName.toUpperCase();
        var index = lCaseName.lastIndexOf( '.' )
        if (index < 0) return null; // . not found
        index++;
        return lCaseName.substr(index);
    }
}

// No way for me to test this myself. Need others to try it.
function MacJpgFilter(f)
{
    if (hasJpgExtension(f)) 
        return true;
    else if ( f instanceof Folder )
        return true;
    else
        return false;
}


// ================================================================================
// activeDocumentHandler
//
// Used to operate on the activeDocument. By gathering all the operations that manipulate the
// activeDocument into one object it is easier to see what is happening.
//
// Unfortunately Photoshop will only perform operations on the activeDocument. Even if you call
// a method on a different document object the operation is still performed on the active document.
// So to avoid confusion all functions here manipulate and refer to the activeDocument.
// ================================================================================

var activeDocumentHandler = new Object();

// --------------------------------------------------------------------------------
// Checks that image requirements are met
// --------------------------------------------------------------------------------

activeDocumentHandler.compliesWithRequirements = function (param) {
    // Returns True if the current image satisfies the requirements.
    var unModified = app.activeDocument.saved
    if (!unModified) return false;
    var extOk = hasJpgExtension(activeDocument.fullName);
    var widthOk = (activeDocument.width <= param.width);
    var heightOk = (activeDocument.height <= param.height);
    var depthOk = (activeDocument.bitsPerChannel == BitsPerChannelType.EIGHT);
    var profileOk = ((activeDocument.colorProfileType != ColorProfile.NONE) && (activeDocument.colorProfileName == param.colourProfile));
    var fileSizeOk = (activeDocument.fullName.length <= (param.maxFilesizekb * 1024));
    return (unModified && extOk && widthOk && heightOk && depthOk && profileOk && fileSizeOk);
};

// --------------------------------------------------------------------------------
// Rotates an image for best fit.
// --------------------------------------------------------------------------------

activeDocumentHandler.rotateForBestFit = function (width, height)  {
    //
    // If necessary, rotates  the document.
    //
    var imageTall, canvasTall;
    imageTall = ((activeDocument.width / activeDocument.height) < 1)
    canvasTall = ((width / height) < 1)
    if (imageTall != canvasTall) {
        app.activeDocument.rotateCanvas (90);
    };
    
};

// --------------------------------------------------------------------------------
// Resizes an image according to limits and aspect ratio.
// --------------------------------------------------------------------------------

activeDocumentHandler.reduceToFit = function (maxWidth, maxHeight, reductionMethod)  {
    //
    // If necessary, reduces the document to fit within the limits given.
    // An alternative (discovered after writing this) is to use Photoshop's FitImage automation plugin.
    //
    var scaleFactor;
    if ((activeDocument.width > maxWidth) || (activeDocument.height > maxHeight) ) {
        if ((activeDocument.width / activeDocument.height) > (maxWidth / maxHeight)) {
            scaleFactor = maxWidth / activeDocument.width; // At a comparable height, our document is wider than the requirements - Scale by Width.
        } else {
            scaleFactor = maxHeight / activeDocument.height; // At a comparable width our document is higher than the requirements - Scale by Height.
        }
        app.activeDocument = activeDocument; // Operations only work on the active document .
        activeDocument.resizeImage(activeDocument.width * scaleFactor, activeDocument.height * scaleFactor, activeDocument.resolution,  reductionMethod);
    };
    return scaleFactor;
};

// --------------------------------------------------------------------------------
// Does the photoshop actions required to make the new image.
// --------------------------------------------------------------------------------

activeDocumentHandler.makeCompliantImage = function (param) {
    // Creates a flat duplicate of the current document that is 8bit, 1024x768 and sRGB.
    //
    
    var reductionMethod;
    switch (param.reductionMethod) {
        case "bicubicSmoother":
            reductionMethod = ResampleMethod.BICUBICSMOOTHER;
            break;
        case "bicubic":
            reductionMethod = ResampleMethod.BICUBIC;
            break;
        case "bicubicSharper":
            reductionMethod = ResampleMethod.BICUBICSHARPER;
            break;
        default:
            throw "Reduction method not implemented: " + param.reductionMethod;
    };

    // Work on a duplicate.
    activeDocument.duplicate(); // The duplicate will become active.
    
    // Flatten document.
    activeDocument.flatten();

    // Do imageActionOne to image.
    if (param.imageActionOneName != 'none') {
        app.doAction(param.imageActionOneName, param.imageActionOneSet);
        activeDocument.flatten(); // Flatten again in case a new layer was created by the action.
    };
    
    // Rotation before resize so that resize is accurate.
    if (param.imageRotationOptions == 'best-fit') {
        this.rotateForBestFit(param.width, param.height);
    };

    // Resize  - Make image container fit within borders.
    var imageAreaWidth;
    var imageAreaHeight;
    switch (param.placeOnCanvasBehaviour) {
        case 'borders-min':
            var borderTop = new UnitValue( (param.canvasOpt1 =="" ? "0" : param.canvasOpt1) + " pixels" );
            var borderBottom = new UnitValue( (param.canvasOpt2 =="" ? "0" : param.canvasOpt2) + " pixels" );
            var borderLeft = new UnitValue( (param.canvasOpt3 =="" ? "0" : param.canvasOpt3) + " pixels" );
            var borderRight = new UnitValue( (param.canvasOpt4 =="" ? "0" : param.canvasOpt4) + " pixels" );
            imageAreaWidth = param.width - borderLeft - borderRight;
            imageAreaHeight = param.height - borderTop - borderBottom;
            this.reduceToFit(imageAreaWidth, imageAreaHeight, reductionMethod);
            break;
        case 'scale-and-offset':
            var scalePercent = new UnitValue( (param.canvasOpt1 =="" ? "100" : param.canvasOpt1) + " pixels" );
            imageAreaWidth = param.width * scalePercent / 100;
            imageAreaHeight = param.height * scalePercent / 100;
            this.reduceToFit(imageAreaWidth, imageAreaHeight, reductionMethod);
            break;
        default:
            this.reduceToFit(param.width, param.height, reductionMethod);
    };

    // postResizeSharpening -  unfortunately named. Canvas work must be done after sharpening.
    if (param.postResizeSharpening== "sharpenForDigitalBFraser") {
        var sharpeningOpacity = Number(param.postResizeSharpeningOpt)
        psTool.bruceFraserDigitalDisplaySharpeningBDH(sharpeningOpacity);
    };

    // Do placementAction to image.
    if (param.placementActionName != 'none') {
        app.doAction(param.placementActionName, param.placementActionSet);
        activeDocument.flatten(); // Flatten again in case a new layer was created by the action.
    };
    
    // placeOnCanvasBehaviour
    if (param.placeOnCanvasBehaviour != 'none') {
        
        // backgroundOptions - could be done outside loop, but may introduce an option which is conditional upon image.
        var backColor = new SolidColor;
        backColor.hsb.hue = 0;
        backColor.hsb.saturation = 0;
        switch (param.backgroundOptions) {
            case 'place-black':
                backColor.hsb.brightness = 0;
                app.backgroundColor = backColor; 
                break;
            case 'place-white':
                backColor.hsb.brightness = 100;
                app.backgroundColor = backColor; 
                break;
            case 'place-gray':
                backColor.hsb.brightness = 50;
                break;
            case 'place-foreground':
                backColor = app.foregroundColor;
                break;
            case 'place-background':
                backColor = app.backgroundColor;
                break;
            default:
        };
    
        switch (param.placeOnCanvasBehaviour) {
            case 'extend-maximum':
                activeDocument.resizeCanvas(param.width,param.height);
                break;
            case 'borders-min':
                var imageLayer = activeDocument.activeLayer.duplicate();
                var imageFinalWidth = imageLayer.bounds[2] - imageLayer.bounds[0];
                var imageFinalHeight = imageLayer.bounds[3] - imageLayer.bounds[1];
                activeDocument.resizeCanvas(param.width, param.height);
                imageLayer.translate(
                    borderLeft - imageLayer.bounds[0] + 0.5 * (imageAreaWidth - imageFinalWidth),
                    borderTop - imageLayer.bounds[1] + 0.5 * (imageAreaHeight - imageFinalHeight)
                );
                activeDocument.activeLayer = activeDocument.backgroundLayer;
                activeDocument.selection.fill(backColor);
                activeDocument.selection.deselect();
                activeDocument.flatten();
                break;
            case 'scale-and-offset':
                var xShift = new UnitValue( (param.canvasOpt2 =="" ? "0" : param.canvasOpt2) + " pixels" );
                var yShift = new UnitValue( (param.canvasOpt3 =="" ? "0" : param.canvasOpt3) + " pixels" );
                var imageLayer = activeDocument.activeLayer.duplicate();
                activeDocument.resizeCanvas(param.width, param.height);
                imageLayer.translate(xShift, yShift);
                activeDocument.activeLayer = activeDocument.backgroundLayer;
                activeDocument.selection.fill(backColor);
                activeDocument.flatten();
                break;
            default:
        };
    
    };
   
    // Do backgroundActionLast to image.
    if (param.backgroundActionLastName != 'none') {
        app.doAction(param.backgroundActionLastName, param.backgroundActionLastSet);
        activeDocument.flatten(); // Flatten again in case a new layer was created by the action.
    };
    
     // Convert profile. Must come later than placeOnCanvasBehaviour/backgroundOptions in case colour critical foreground colour was used.
    activeDocument.convertProfile(param.colourProfile, Intent.PERCEPTUAL, true);
    
    // Change to 8bit as last step to minimise conversion errors.
    if (activeDocument.bitsPerChannel != BitsPerChannelType.EIGHT) {
        activeDocument.bitsPerChannel = BitsPerChannelType.EIGHT
    };

    return activeDocument; // Our new image is now the active document.
};

// --------------------------------------------------------------------------------
// Saves the new image, will just copy if the image already satisfies the requirements and has no unsaved changes.
// The unsaved changes check is necessary because the script allows creation of an image even if the
// original is not yet saved.
// --------------------------------------------------------------------------------

activeDocumentHandler.saveSmallJPEG = function (imageFile, imageParameters) {
    
    // Copies current image to destination if it satisfies requirements,
    // if not duplicates it and manipulates it to requirements, saving to destination.
    //
    
      // Check that originals will not be overwritten.
    if (activeDocument.fullName == imageFile.fullName)
        throw "Refused request to overwrite original - process aborted. Save to a different folder if you're processing JPGs."

    if ((app.activeDocument.saved) && (activeDocumentHandler.compliesWithRequirements(imageParameters))) {
        
        // No work to do - just do a file copy to the destination.
        activeDocument.fullName.copy(imageFile);
        
    } else {
        
        // Work to do.
        
        // Duplicate the image and modify the duplicate to our requirements.
        // Faster and less crash prone to resize before SaveForWeb.
        var newImage = this.makeCompliantImage(imageParameters);

        // Save the new image and close it .
        try {
            psTool.saveJPEGLimitFilesizeKb(imageFile, imageParameters.maxFilesizekb);
        }
        catch (e) {
            if (e != "Image exceeds maximum filesize.")
                throw e; // Reraise exception.;
        }
        finally {
              // Discard the new document.
            newImage.close(SaveOptions.DONOTSAVECHANGES);
        };
    
    }
};


// ================================================================================
// Main
// ================================================================================

var psTool;

try {

    //  Get our helper Photoshop Tool object.
    psTool = new PhotoshopTool ();

    // Get actions.
    var gActionOptions = [{actionSetName:"none",actionName:"none",id:"action: none actionSet: none",text:"No photoshop action"}].concat(psTool.getActionList());
    var gActionIds = [];
    for (var i=0; i < gActionOptions.length; i++) {
        gActionIds.push(gActionOptions[i].id);
    };

    // Save current user preferences.
    psTool.saveSettings();
            
    //record original ruler preference before doing anything
    var startRulerUnits = app.preferences.rulerUnits

    if (!isSupportedInThisVersion()) {
        if (!confirm ("It is not known if this script will work with this version of Photoshop, are you sure you want to continue?", true, "Not tested for this version of Photoshop."))
            throw "Script cancelled."
    };

    var settings = new Settings();
    var runOptions = new Object();

    settings.getConfiguration();
    var usrValue = showUiMain(runOptions, settings);
    settings.putConfiguration(); // Have to save changes after Done.
    
    if (1 !=usrValue)
        throw "Script cancelled."; // Done button exits here.

    // Save settings.
    if (runOptions.inputOption != "currentImage") {
        settings.userData.lastProcessed = runOptions.inputName;
        settings.userData.lastSaveFolder = runOptions.saveFolder.fsName;
    };
    settings.putConfiguration(); // Have to put config again to save the above folders.

    //change settings
    app.preferences.rulerUnits = Units.PIXELS;

    // Single Mode or Folder
    if (runOptions.inputOption == "currentImage") {
        
        // SINGLE IMAGE MODE

        if (!psTool.isDocumentActive()) {
            alert ("No image open.");
            throw "Script cancelled."
        }

        if (!app.activeDocument.saved)
            if (!confirm ("Your master image has changes that have not yet been saved, are you sure you want to continue?", true, "Unsaved changes"))
                throw "Script cancelled."

        if (runOptions.saveFolder) {
            if (! runOptions.inputName) throw "Unexpected error: Name has no value."
            if (! runOptions.saveFolder.exists) runOptions.saveFolder.create();
            imageFile = new File(runOptions.saveFolder + "/" + runOptions.inputName);
            if (!hasJpgExtension(imageFile))
                imageFile = new File (imageFile + ".jpg");
        }
        else {
            imageFile = promptForJpgSaveFile("Choose a folder and enter the image title as the file name.");
            if (! imageFile)
                throw "Script cancelled.";
        };
    
        // Save for Web changes spaces to hypens - do it here so as not to lose track of the new file.
        var tmp = tmp = new File(imageFile.path)
        tmp.changePath(unescape(imageFile.name).replace(/ /g,"-"))
        imageFile = tmp;

        // Check that they won't overwrite orginal.
        if (app.activeDocument.fullName == imageFile.fullName) {
            alert ("Same name as original. Cancelled.");
            throw "Script cancelled.";
        };
    
        if (imageFile.exists)
            if (!confirm(imageFile.name + " already exists, do you want to replace it?", true, "Confirm file replace"))
                throw "Script cancelled.";

        if  (   (runOptions.imageParameters.smallImageWarning)
                && (activeDocument.width < runOptions.imageParameters.width)
                && (activeDocument.height < runOptions.imageParameters.height)
            )
            if (! confirm("Your image is smaller in width and height than the specified limits. This means you are not getting the benefit of the extra resolution available to you. Are you sure you want to continue?",true,"Small image!"))
                throw "Script cancelled.";

        // Process the image
         psTool.setDefaultSettings();
        try {
            activeDocumentHandler.saveSmallJPEG(imageFile, runOptions.imageParameters);
        }
        catch (e) {
            throw e; // reraise any exceptions
        }
        finally {
             psTool.restoreSettings();
        };

        // Open after save
        if (runOptions.openAfterSave)
            app.open(imageFile);

    } else {

        // FOLDER PROCESSING MODE

        var inputFolder = new Folder(runOptions.inputName);
        var filesToProcess = psTool.getOpenableFiles(inputFolder);
        var imageFile,saveFile, someAlreadyExist, someWillOverwriteOriginal, someExceedFilesize, someTooSmall;
        
         var namingSubFn = function (imageFile, prefix, suffix) {
            var tmp = unescape(imageFile.name).replace(/ /g,"-");
            var saveFile = new File(runOptions.saveFolder)
            saveFile.changePath('./' + prefix + tmp.substr(0,tmp.lastIndexOf('.')) + suffix + '.jpg');
            return saveFile;
         };
  
        // Setup a naming function for the batch.
        var namingFn;
        switch (runOptions.imageParameters.namingBehaviour) {
            case "suffixSmall":
                namingFn = function (imageFile) {return namingSubFn (imageFile, "", ".small")};
                break;
            case "suffixThumb":
                namingFn = function (imageFile) {return namingSubFn (imageFile, "", ".thumb")};
                break;
            case "prefixSmall":
                namingFn = function (imageFile) {return namingSubFn (imageFile, "small.", "")};
                break;
            case "prefixThumb":
                namingFn = function (imageFile) {return namingSubFn (imageFile, "thumb.", "")};
                break;
            default:
                namingFn = function (imageFile) {return namingSubFn (imageFile, "", "")};
        };

        // Create output folder if it doesn't exist.
        if (!runOptions.saveFolder.exists)
            if (!runOptions.saveFolder.create())
                throw "Could not create output folder.";

        // Create destination names and check for replacements.
        var outputFiles = new Array();
        for (var i=0; i<filesToProcess.length;i++) {
            imageFile = filesToProcess[i];
            saveFile = namingFn(imageFile);
        if (saveFile.fullName == imageFile.fullName) someWillOverwriteOriginal = true;
        if (saveFile.exists) someAlreadyExist = true;
        outputFiles[i] = saveFile;
        };

        // Check that they won't overwrite orginal.
        if (someWillOverwriteOriginal) {
            alert ("Some new files will have the same name as their original. Process cancelled. Consider using a different naming option or using a subfolder.");
            throw "Script cancelled.";
        };

        // Confirm replacement in advance
        if ( someAlreadyExist && (!confirm ("Some files will be replaced in the save folder, do you want to continue?", true, "Replace files?.")))
            throw "Script cancelled."

        var usrCancel, saveCount = 0;
        var progressWin = new Window('palette', 'Processing');
        progressWin.bar = progressWin.add('progressbar', undefined, 0, filesToProcess.length);
        progressWin.bar.preferredSize = [500, 20];
        progressWin.cnclBtn = progressWin.add('button', undefined, 'cancel' );
        progressWin.cnclBtn.onClick = function () {
                usrCancel = true;
                this.parent.close();
        }
        progressWin.center();
        progressWin.show();

        // Time to get on with it.
        psTool.saveSettings();
        try {
            for (var i=0; (i<filesToProcess.length) && !usrCancel; i++) {
                try {
                    imageFile = filesToProcess[i];
                    saveFile = outputFiles[i];
                    progressWin.text = "Save Small JPEG - Processing '" + imageFile.name + "' (" + saveCount + " saved,  " + (filesToProcess.length - i )+ " left)";
                    app.open(imageFile);
                    activeDocumentHandler.saveSmallJPEG(saveFile, runOptions.imageParameters);
                    saveCount = i + 1;
                        if  (   (runOptions.imageParameters.smallImageWarning)
                                && (activeDocument.width < runOptions.imageParameters.width)
                                && (activeDocument.height < runOptions.imageParameters.height)
                            )
                            someTooSmall = true;
                }
                catch (e) {
                    if (e == "Image exceeds maximum filesize.")
                        someExceedFilesize = true;
                    else
                        throw e; // Reraise exception.
                }
                finally {
                    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES); // Closes the opened doc.
                }
                progressWin.bar.value = i + 1;
                progressWin.hide();
                progressWin.show();
            };
        }
        finally {
            progressWin.close();
            psTool.restoreSettings();
        };
        var msgTxt = 'Save Small JPEG - Processing complete.';
        if (usrCancel) msgTxt = 'Save Small JPEG - Processing cancelled.';
        alert (msgTxt + ' ' + saveCount + ' saved to ' + runOptions.saveFolder.fsName);
        if (someExceedFilesize) alert ('Some files were created that were larger than your specified maximum filesize.');
        if (someTooSmall) alert ('Some images were created that were smaller than *both* the maximum width and maxium height.');
    };


}

// Give a generic alert.

catch( e ) {
    if (e != "Script cancelled."){
        var tmp; tmp = e.line; if (!tmp) tmp = "" else tmp = " : " + tmp
        alert( "Error: " + e + tmp , "Error while running script", true);
    }
}

finally {
        //restore the original preferences
        app.preferences.rulerUnits = startRulerUnits;
};
