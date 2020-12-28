// ================================================================================
// Title: Save Small JPEG
//
// This script creates a version of the currently open image document according to named settings.
//
// This was my first Javascript script, evolved while learning photoshop scripting.
// - As I find the time and inclination I am refactoring it.
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

var scriptVersion = '1.61'; // String comparison operators operate on this so keep two decimal digits.

// Using a file to store data between sessions - hopefully will work with older versions.
var configDataFile = new File (app.preferencesFolder)
configDataFile.changePath('SaveSmallJpegSettings.xml');


// Search for an element in an array.
Array.prototype.indexOf = function (x) {
    var L = this.length;
    for (var i = 0; i < L; i++) { 
        if (this[i]=== x)
            return i;
    }
    return -1;
}

// Search for first element in array that satisfies the predicate.
Array.prototype.indexWhen = function (predicate) {
    var L = this.length;
    for (var i = 0; i < L; i++) { 
        if (predicate(this[i]))
            return i;
    }
    return -1;
}

// Test for Numeric number.
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var theNextFirstWednesdayInMonth = function (startDate) {
    var dayInMilliseconds = (24*60*60*1000);
    var targetDate = startDate;
    for (
        var x=startDate;
        ((x.getDay() != 3) || ((x.getDate() - 7 ) > 0));
        x.setTime(x.getTime() + dayInMilliseconds)
    ) {
        targetDate = x;
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

// Some things that shouldn't be this hard.
// See: https://community.adobe.com/t5/premiere-pro/how-to-check-given-path-isfile-or-isdirectory-in-jsx/td-p/9159544?page=1
function doesFileExist(path)  
{  
     var file = Folder(path);     // Returns a File object if the path exists and is a file.  
     return file.constructor == File;  
}  

function doesDirectoryExist(path)  
{
     var dir = Folder(path);     // Returns a Folder object if the path is a folder or doesn't exist.  
     return dir.constructor == Folder && dir.exists;  
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

    this.getCurrentDocumentPath = function () {
        // In current image mode we have the folder if the document is open, previously saved and hasn't moved after opening.
        currentPath = null;
        try {
            app.activeDocument; // Testing to see if the current image is open.
            currentPath = new Folder (app.activeDocument.path);
        } catch (e) {
            // Silent error - currentPath is null.
        }
        return currentPath;
    }

    this.canOpenInPhotoshop = function (f) {
        var ext = getFileExtensionOrType(f);
        if (!ext) return false;
        return (0 <= this.openableFileTypes.indexOf(ext.toUpperCase()));
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
        
        // Check parameter.
        if (! maxKb) {
            throw "Maximum filesize must be specified.";
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
                            var actionName = desc.getString( gKeyName );
                            actn = new Object();
                            actn.name = ("action: " + actionName + " actionSet: " + actionSetName);
                            actn.text = ("[" + actionSetName + "] " + actionName );
                            actn.actionSetName = actionSetName;
                            actn.actionName = actionName;
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
                <maxHeightPx>1200</maxHeightPx>\
                <smallImageCheck>warn</smallImageCheck>\
                <presetNotes></presetNotes>\
                <inputOption>currentImage</inputOption>\
                <saveQualityOption>maxFilesize</saveQualityOption>\
                <saveQualityValue>2000</saveQualityValue>\
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

            if (data.scriptVersion < "1.50") {
                preset.maxFilesizeKb = this.loadXmlElt(presetXML, "maxFilesizeKb");
            } else {
                preset.saveQualityOption = this.loadXmlElt(presetXML, "saveQualityOption");
                preset.saveQualityValue = this.loadXmlElt(presetXML, "saveQualityValue");
            }

            preset.smallImageCheck = this.loadXmlElt(presetXML, "smallImageCheck");
            preset.presetNotes = this.loadXmlElt(presetXML, "presetNotes","");
            preset.inputOption = this.loadXmlElt(presetXML, "inputOption", "currentImage");
            preset.reductionMethodOption = this.loadXmlElt(presetXML, "reductionMethodOption", pstOpts.defaultReductionMethodOption);
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
            preset.saveBehaviour = this.loadXmlElt(presetXML, "saveBehaviour", 'saveToSaveFolder');
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
        // scriptVersion was introduced in 1.10
        if (data.scriptVersion < "1.10") {
            for (var i=0; i < data.preset.length; i++) {
                var preset = data.preset[i];
                // inputOption Was to be upgraded in 1.10, but ultimately was done by 1.15.
                if (!preset.saveBehaviour) preset.saveBehaviour = 'saveToSaveFolder'; // 1.10: 1.09 and earlier had null to indicate save to folder option. Will get upgraded.
                preset.reductionMethodOption = pstOpts.defaultReductionMethodOption; // 1.10: Introduced this setting.
                preset.namingBehaviour = "original"; // 1.10: Introduced this setting.
                preset.postResizeSharpening = "none"; // 1.10: Introduced this setting.
                // subFolderOption Was to be upgraded in 1.10, but ultimately was done by 1.15.
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

            var oldSubfolderOptions = [
                'none', 'today-yymm', 'today-yyyymm', 'today-yymmdd', 'today-yyyymmdd',
                'firstwed-yymm', 'firstwed-yyyymmdd'
            ];

            for (var i=0; i < data.preset.length; i++) {
                var preset = data.preset[i];

                // 1.09 used index numbers into subfolder option list, 1.10 was supposed
                // to have upgraded these, but missed some somehow. Try again.
                // As we are doing the upgrade again here in 1.15, the redundant upgrade
                // code for 1.10 has been removed.
                if (isNumeric(preset.subFolderOption)) {
                    preset.subFolderOption = oldSubfolderOptions[Number(preset.subFolderOption)];
                };

                // 1.09 used index numbers into inputOption list, 1.10 was supposed to have upgraded these, but missed some somehow. Try again.
                // As we are doing the upgrade again here in 1.15, the redundant upgrade
                // code for 1.10 has been removed.
                if (isNumeric(preset.inputOption)) {
                    preset.inputOption = pmdl.InputOptions[Number(preset.inputOption)].name;
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

        // 1.40: Upgrade earlier setting files.
        if (data.scriptVersion < "1.40") {
            for (var i=0; i < data.preset.length; i++) {
                var preset = data.preset[i];
                // Use none instead of empty string for smallImageCheck
                if (preset.smallImageCheck != "warn") {
                    preset.smallImageCheck = "none";
                };
            };
        };
   
        // 1.50: Upgrade earlier setting files.
        if (data.scriptVersion < "1.50") {
            for (var i=0; i < data.preset.length; i++) {
                var preset = data.preset[i];
                // Convert maxfilesizeKb to quality option choice and value.
                if ( (! preset.maxFilesizeKb)
                    || (preset.maxFilesizeKb == "")) {
                    preset.saveQualityOption = "jpegQuality";
                    preset.saveQualityValue = "100";
                } else {
                    preset.saveQualityOption = "maxFilesize";
                    preset.saveQualityValue = preset.maxFilesizeKb
                };
                delete preset.maxFilesizeKb;
            };
        };
   
        // 1.54: Upgrade earlier setting files.
        if (data.scriptVersion < "1.54") {
            for (var i=0; i < data.preset.length; i++) {
                var preset = data.preset[i];
                // Change internal code to avoid confusion.
                if (preset.placeOnCanvasBehaviour == "extend-maximum") {
                    preset.placeOnCanvasBehaviour = "fixed-canvas";
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
        if (elt)
            result = string.slice( elt.valueStart, elt.valueEnd)
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
// Fields
// ================================================================================

function OptionFieldType (name, optionsName) {
    this.name = name;
    this.value = null;
    this.options = pstOpts[optionsName];
};

OptionFieldType.prototype.getOptIdx = function () {
    var name = this.value;
    return this.options.indexWhen(
        function (x) {
            return (x.name == name)
        }
    );
};

OptionFieldType.prototype.setValue = function (value) {
    this.value = value;
    $.writeln('setOption ' + this.name + ' ' + this.value);
};

OptionFieldType.prototype.setOptIdx = function (idx) {
    this.value = this.options[idx].name;
    $.writeln('setOptIdx ' + this.name + ' ' + this.value);
};

OptionFieldType.prototype.loadPrst = function (preset) {
    this.value = preset[this.name];
};

OptionFieldType.prototype.updPreset = function (preset) {
    preset[this.name] = this.value;
};

// --------------------------------------------------------------------------------

function ActionOptionFieldType (name, optionsName) {
    this.name = name;
    this.value = null;
    this.options = pstOpts[optionsName];
};

ActionOptionFieldType.prototype.getOptIdx = function () {
    var name = this.value;
    return this.options.indexWhen(
        function (x) {
            return (x.name == name)
        }
    );
};

ActionOptionFieldType.prototype.setValue = function (value) {
    this.value = value;
    $.writeln('setOption ' + this.name + ' ' + this.value);
};

ActionOptionFieldType.prototype.setOptIdx = function (idx) {
    var option = this.options[idx];
    this.value = option.name;
    $.writeln('setOptIdx ' + this.name + ' ' + this.value);
};

ActionOptionFieldType.prototype.loadPrst = function (preset) {
    var actnSetField = this.name + 'Set';
    var actnNameField = this.name + 'Name';
    var name = "action: " + preset[actnNameField] + " actionSet: " + preset[actnSetField];
    this.value = name;
};

ActionOptionFieldType.prototype.updPreset = function (preset) {
    var options = this.options;
    var value = this.value;
    var idx = this.getOptIdx();
    var option = options[idx];
    preset[this.name + 'Set'] = option.actionSetName;
    preset[this.name + 'Name'] = option.actionName;
};

// ================================================================================
// Main Options
// ================================================================================

function MainOptions () {

    this.AfterSaveBehaviourOptions = [
        {
            name: '',
            text: 'None'
        },
        {
            name: 'open',
            text: 'Open the created image in Photoshop'
        }
    ];
};

// ================================================================================
// Preset Options
// ================================================================================

function PresetOptions () {

    this.getOptionIndxFor = function (name, optionsName) {
        var options = this[optionsName];
        return options.indexWhen(
            function (x) {
                return (x.name == name)
            }
        );
    };

    // --------------------------------------------------------------------------------

    this.InputOptions = [
        // Note that script data upgrade routine uses index numbers into these options.
        {
            name: 'currentImage',
            text: 'Process the current image only'
        },
        {
            name: 'allImagesInFolder',
            text: 'Process all images in a folder'
        },
        {
            name: 'listOfFiles',
            text: 'Process a list of images'
        }
    ];

    // --------------------------------------------------------------------------------

    this.SaveQualityOptions = [
        {
            name: 'jpegQuality',
            text: 'Jpeg quality (0 - 100)'
        },
        {
            name: 'maxFilesize',
            text: 'Max filesize (Kb)'
        }
    ];

    // --------------------------------------------------------------------------------

    this.SmallImageWarningOptions = [
        {
            name: 'none',
            text: 'None'
        },
        {
            name: 'warn',
            text: 'Show warning if an image is both smaller and narrower than limits'
        }
    ];

    // --------------------------------------------------------------------------------

    this.SaveBehaviourOptions = [
        {
            name: 'none', // An invalid save state.
            text: 'Indeterminate.'
        },
        {
            name: 'ask',
            text: 'Ask where to save.'
        },
        {
            name: 'saveToSourceFolder',
            text: 'Save to the original folder.'
        },
        {
            name: 'saveToSaveFolder',
            text: 'Save to chosen folder.'
        },
    ]

    // --------------------------------------------------------------------------------

    this.SubfolderOptions = [
        // Note that script data upgrade routine uses index numbers into these options.
        {
            name:'none',
            text: 'None'
        },
        {
            name:'today-yymm',
            text: 'yymm'
        },
        {
            name:'today-yyyymm',
            text: 'yyyymm'
        },
        {
            name:'today-yymmdd',
            text: 'yymmdd'
        },
        {
            name:'today-yyyymmdd',
            text: 'yyyymmdd'
        },
        {
            name:'firstwed-yymm',
            text: 'First Wednesday in month (yymm)'
        },
        {
            name:'firstwed-yyyymmdd',
            text: 'First Wednesday in month (yyyymmdd)'
        },
        {
            name:'const-jpg',
            text: 'jpg'
        },
        {
            name:'const-edi',
            text: 'edi'
        },
        {
            name:'const-thumbs',
            text: 'thumbs'
        },
        {
            name:'const-prints',
            text: 'prints'
        },
        {
            name:'const-smalljpeg',
            text: 'smalljpeg'
        },
        {
            name:'const-ig',
            text: 'instagram'
        },
        {
            name:'const-fb',
            text: 'facebook'
        }
    ];
   
    // --------------------------------------------------------------------------------

    this.NamingBehaviourOptions = [
        {
            name: 'original',
            text: 'Use the original document name'
        },
        {
            name: 'suffixSmall',
            text: 'Add .small to the end of the original name'
        },
        {
            name: 'suffixThumb',
            text: 'Add .thumb to the end of the original name'
        },
        {
            name: 'prefixSmall',
            text: 'Add small. to the start of the original name'
        },
        {
            name: 'prefixThumb',
            text: 'Add thumb. to the start of the original name'
        },
    ];

    // --------------------------------------------------------------------------------

    this.ImageRotationOptions = [
        {
            name: 'none',
            text: 'No rotation  (e.g. for web/screen/projected images)'
        },
        {
            name: 'best-fit',
            text: 'Rotate image for best fit  (e.g. for prints)'
        }
    ];

    // --------------------------------------------------------------------------------

    this.defaultReductionMethodOption;
    if (7 < getVersion()) {
        this.defaultReductionMethodOption = 'bicubicSharper'; // ResampleMethod.BICUBICSHARPER
    } else {
        this.defaultReductionMethodOption = 'bicubic'; // ResampleMethod.BICUBIC
    }

    this.ReductionMethodOptions = [
        {
            name:'bicubic',
            text:'Use Bicubic resampling to resize (the classic method)'
        }
    ];

    if (7 < getVersion()) {
        this.ReductionMethodOptions.push(
            {
                name:'bicubicSharper',
                text:'Use Bicubic Sharper to resize (has a sharpening effect)'
            },
            {
                name:'bicubicSmoother',
                text:'Use Bicubic Smoother to resize'
            }
        )
    };

    // --------------------------------------------------------------------------------

    this.PostResizeSharpeningOptions = [
        {
            name: 'none',
            text: 'No separate sharpening step'
        },
        {
            name: 'sharpenForDigitalBFraser',
            text: 'Sharpen for digital display using Bruce Fraser method (not recommended to use with Bicubic Sharper)'
        }
    ];
    
    // --------------------------------------------------------------------------------

    this.PlaceOnCanvasBehaviourOptions = [
        {
            // In this mode we can just copy the image if it meets requirements.
            name: 'none',
            text: 'Crop to resized image'
        },
        {
            // In this mode we must create a new image.
            name: 'borders-min',
            text: 'Image contained within margins'
        },
        {
            // In this mode we must create a new image.
            name: 'scale-and-offset',
            text: 'Image contained within percentage of canvas area with +/- pixel offset'
        },
        {
            // In this mode we can just copy the image if it meets requirements.
            name: 'fixed-canvas',
            text: 'Fixed canvas size'
        },
        {
            // In this mode we can just copy the image if it meets requirements.
            name: 'limit-height', // Added in version 1.50.
            text: 'Limit to height range (e.g for Instagram)'
        }
    ];

    // --------------------------------------------------------------------------------

    this.BackgroundOptions = [
        {
            name: 'place-black',
            text: 'Set on black'
        },
        {
            name: 'place-white',
            text: 'Set on white'
        },
        {
            name: 'place-gray',
            text: 'Set on gray'
        },
        {
            name: 'place-foreground',
            text: 'Set on foreground colour'
        },
        {
            name: 'place-background',
            text: 'Set on background colour'
        }
    ];

    // --------------------------------------------------------------------------------

    this.ActionOptions = [
        {
            name:"action: none actionSet: none",
            text:"No photoshop action",
            actionSetName:"none",
            actionName:"none"
        }
    ].concat(
        psTool.getActionList()
    );
   
};

// ================================================================================
// Edit Models
// ================================================================================

function SimpleRule (field, desc, isValid) {
    this.field = field;
    this.description = desc;
    this.isValid = isValid;
};

function MainEditModel (mainOpts, runOptions, settings) {

    // --------------------------------------------------------------------------------
    // State varaibles.

    this.options = mainOpts;
    this.rnOpts = runOptions;
    this.sttngs = settings;

    this.mvlu = this.sttngs.userData;

    this.processFile = '';
    this.batchProcessPath = null;

    // --------------------------------------------------------------------------------
    // Setters and Getters.

    this.setCurrentPreset = function (idx) {
        $.writeln('setCurrentPreset ' + idx);
        this.mvlu.currentPreset = idx;
        var preset = this.sttngs.userData.preset[idx];
    };

    this.getCurrentPreset = function () {
        var idx = Number(this.mvlu.currentPreset);
        var preset = this.mvlu.preset[idx];
        return preset;
    };

    this.getCurrentPresetIdx = function () {
        var idx = Number(this.mvlu.currentPreset);
        return idx;
    };

    this.getPresetSummary = function (idx) {
        var preset = this.mvlu.preset[idx];

        var txt = preset.maxWidthPx + " x ";
        if (preset.placeOnCanvasBehaviour == "limit-height")
            txt = txt + preset.canvasOpt1 + "-";
        txt = txt + preset.maxHeightPx + " pixels " 
            + "8bit \'" + preset.colourProfileName + "\'";
        switch (preset.saveQualityOption) {
            case "jpegQuality":
                txt = txt + " (" + preset.saveQualityValue + "% quality)";
                break;
            case "maxFilesize":
                txt = txt + " (" + preset.saveQualityValue + "Kb max.)";
                break;
        };

        return txt;
    };

    this.getCurrentPresetSummary = function (idx) {
        var idx = this.mvlu.currentPreset;
        var txt = this.getPresetSummary(idx);
        return txt;
    };

    this.isListOfFilesMode = function () {
        var preset = this.getCurrentPreset();
        var isListOfFiles = (preset.inputOption == "listOfFiles");
        return isListOfFiles;
    };

    this.getOutputFolder = function () {

        // outputFolder is valid only if we have some specification.

        var preset = this.getCurrentPreset();
        var currentImageOnly = (preset.inputOption == "currentImage");
        var savingToSourceFolder = (preset.saveBehaviour == 'saveToSourceFolder')

        var subfolderTxt = this.getSubfolderName();
        var outputFolder = null;

        if (savingToSourceFolder) {
            if (currentImageOnly) {
                // In current image mode we have the folder if the document is open and previously saved.
                try {
                    app.activeDocument; // Testing to see if the current image is open.
                    outputFolder = psTool.getCurrentDocumentPath ();
                    outputFolder.changePath(subfolderTxt);
                } catch (e) {
                    // Silent error - outputFolder is null.
                }
            } else {
                // In folder processing batch mode - we will have the folder only if the process path has been specified.
                if (this.batchProcessPath) {
                    outputFolder = new Folder (this.batchProcessPath);
                    outputFolder.changePath(subfolderTxt);
                }
            }
        } else {
            // We should have a folder specified already in our preset.
            outputFolder = new Folder (preset.saveFolder);
            outputFolder.changePath(subfolderTxt);
        };

        return outputFolder;
    };

    this.setProcessPath = function (fileOrFolder) {
        $.writeln('setProcessPath ' + fileOrFolder);
        this.batchProcessPath = fileOrFolder;
    };

    this.getProcessPathTxt = function () {
        var txt = '';
        if (this.batchProcessPath)
            txt = this.batchProcessPath.fsName;
        return txt;
    };

    this.getLastProcessed = function () {
        var lastProcessed = null;
        if (this.batchProcessPath) {
            lastProcessed = this.batchProcessPath;
        } else {
            lastProcessed = Folder(this.sttngs.userData.lastProcessed);
        };
        return lastProcessed;
    };

    this.getSubfolderName = function () {
        var today = new Date();
        var preset = this.getCurrentPreset();
        var subfolderTxt = '';
        switch (preset.subFolderOption) {
            case "none":
                break;
            case "const-edi":
            case "const-jpg":
            case "const-prints":
            case "const-thumbs":
            case "const-ig":
            case "const-fb":
            case "const-smalljpeg":
                var idx = pstOpts.getOptionIndxFor(preset.subFolderOption,'SubfolderOptions');
                subfolderTxt = pstOpts.SubfolderOptions[idx].text;
                break;
            case "firstwed-yymm":
                var theDate = theNextFirstWednesdayInMonth(today);
                subfolderTxt = formatDate(theDate, "yymm");
                break;
            case "firstwed-yyyymmdd":
                var theDate = theNextFirstWednesdayInMonth(today);
                subfolderTxt = formatDate(theDate, "yyyymmdd");
                break;
            default:
                var idx = pstOpts.getOptionIndxFor(preset.subFolderOption,'SubfolderOptions');
                var textFormat = pstOpts.SubfolderOptions[idx].text;
                subfolderTxt = formatDate(today, textFormat);
        };
        return subfolderTxt;
    };

    // --------------------------------------------------------------------------------
    // Helpers that translate between state types to
    // presentation types.

    this.setBooleanOption = function (field, value, optionsName) {
        var options = this.options[optionsName];
        var option = options[value ? 1 : 0];
        var code = option.name;
        this.mvlu[field] = code;
        $.writeln('setBooleanOption ' + field + ' ' + option.name);
    };

    this.getBooleanOption = function (field, optionsName) {
        var options = this.options[optionsName];
        var code = this.mvlu[field];
        var trueOption = options[1];
        var isTrueOption = (code == trueOption.name)
        return isTrueOption;
    };

    this.needSaveAsPrompt = function () {
        var preset = this.getCurrentPreset();
        var isAskMode = ('ask' == preset.saveBehaviour);
        var docPath = psTool.getCurrentDocumentPath ();
        var isFolderMissing = (docPath == null);
        // TODO:
        //  Resolve case where folder is missing but we are in name edit field mode
        //  (a)  file is new - should be in prompt mode
        //  (b) file location subsequently got moved 
        // Need to introduce a state machine to resolve this properly as this code now has inconsistent states.
        // Without doing this, the user will have to enter a name and then will get
        // as Save As dialog as well.
        // var needPrompt = (isAskMode || isFolderMissing);
        var needPrompt = (isAskMode);

        return needPrompt;
    };

    this.isReadyToRun = function () {
        var preset = this.getCurrentPreset();
        var currentImageOnly = (preset.inputOption == "currentImage");
        var isReady = false;
        if (this.needSaveAsPrompt())
            // Need a document open.
            isReady = psTool.isDocumentActive()
        else
            if (currentImageOnly)
                // Name must be input if we have a folder name.
                isReady = (psTool.isDocumentActive()) && (this.processFile != '')
            else
                // Batch processing path must be specified.
                isReady = (this.batchProcessPath != null);
        return isReady;
    };

    // --------------------------------------------------------------------------------
    // Modification

    this.removePreset = function () {
        var idx = this.mvlu.currentPreset;
        this.sttngs.deletePreset(idx);
    };

    this.savePreset = function (editedPreset) {
        var idx = this.mvlu.currentPreset;
        var existingPreset = this.mvlu.preset[idx];
        if (existingPreset.name == editedPreset.name)
            // Same name, update existing preset.
            this.mvlu.preset[idx] = editedPreset
        else
            // Different name, create new preset - alphabetical order.
            this.sttngs.insertPreset(editedPreset);
    };

    // --------------------------------------------------------------------------------

    this.finaliseRunOptions = function () {

        var preset = this.getCurrentPreset();
        var prcOpt = this.rnOpts;

        prcOpt.openAfterSave = this.getBooleanOption(
            'afterSaveBehaviour', 'AfterSaveBehaviourOptions'
        );

        prcOpt.inputOption = preset.inputOption;

        if (preset.inputOption == "currentImage")
            prcOpt.inputName = this.processFile
        else
            prcOpt.inputName = this.getProcessPathTxt();

        // Set the image parameters according to the current Preset.
        var imgp = new Object();
        prcOpt.imageParameters = imgp;

        imgp.width = new UnitValue(preset.maxWidthPx + " pixels") ;
        imgp.height = new UnitValue(preset.maxHeightPx + "pixels");
        imgp.reductionMethod = preset.reductionMethodOption;
        imgp.namingBehaviour = preset.namingBehaviour;
        imgp.imageRotationOptions = preset.imageRotationOptions;
        imgp.placeOnCanvasBehaviour = preset.placeOnCanvasBehaviour;
        imgp.backgroundOptions = preset.backgroundOptions;
        imgp.canvasOpt1 = preset.canvasOpt1;
        imgp.canvasOpt2 = preset.canvasOpt2;
        imgp.canvasOpt3 = preset.canvasOpt3;
        imgp.canvasOpt4 = preset.canvasOpt4;
        imgp.postResizeSharpening = preset.postResizeSharpening;
        imgp.postResizeSharpeningOpt = preset.postResizeSharpeningOpt;
        imgp.imageActionOneSet = preset.imageActionOneSet;
        imgp.imageActionOneName = preset.imageActionOneName;
        imgp.placementActionSet = preset.placementActionSet;
        imgp.placementActionName = preset.placementActionName;
        imgp.backgroundActionLastSet = preset.backgroundActionLastSet;
        imgp.backgroundActionLastName = preset.backgroundActionLastName;
        imgp.colourProfile = preset.colourProfileName.toString();
        imgp.saveQualityOption = preset.saveQualityOption;
        imgp.saveQualityValue = Number(preset.saveQualityValue);
        imgp.smallImageWarning = (preset.smallImageCheck == "warn");
    };
};

function PresetEditModel (presetOpts, preset) {

    // Close in concept to a Presentation Model
    // (https://martinfowler.com/eaaDev/PresentationModel.html) but my
    // emphasis is on editing an in-memory model structure.

    // --------------------------------------------------------------------------------
    // State varaibles.

    this.value = preset;
    this.errors = null;
    this.options = presetOpts;
    this.field = new Object();

    // --------------------------------------------------------------------------------
    // Associate options to fields.


    this.assignOptions = function (field, optionsName) {
        this.field[field] = new OptionFieldType(field, optionsName);
    };
    this.assignActionOptions = function (field, optionsName) {
        this.field[field] = new ActionOptionFieldType(field, optionsName);
    };


    this.assignOptions('inputOption', 'InputOptions');
    this.assignOptions('saveQualityOption', 'SaveQualityOptions');
    this.assignOptions('imageRotationOptions', 'ImageRotationOptions');
    this.assignOptions('reductionMethodOption', 'ReductionMethodOptions');
    this.assignOptions('postResizeSharpening', 'PostResizeSharpeningOptions');
    this.assignOptions('saveBehaviour', 'SaveBehaviourOptions');
    this.assignOptions('subFolderOption', 'SubfolderOptions');
    this.assignOptions('namingBehaviour', 'NamingBehaviourOptions');
    this.assignOptions('placeOnCanvasBehaviour', 'PlaceOnCanvasBehaviourOptions');
    this.assignOptions('backgroundOptions', 'BackgroundOptions');
    this.assignActionOptions('imageActionOne', 'ActionOptions');
    this.assignActionOptions('placementAction', 'ActionOptions');
    this.assignActionOptions('backgroundActionLast', 'ActionOptions');

    // --------------------------------------------------------------------------------
    // Setters and Getters.

    this.setInputOption = function (idx) {
        this.setOptionIdx('inputOption', idx);

        var currentImageOnly = (this.isOptionFieldValue('inputOption', 'currentImage'));

        if (currentImageOnly) {
            this.setOptionValue('namingBehaviour','original');
        } else {
            this.setOptionValue('saveBehaviour','none');
        };
    };

    this.getSaveFolder = function () {
        var fldr = this.value.saveFolder;
        if (fldr == '') {
            return '';
        } else {
            fldr = new Folder (fldr);
            return fldr.fullName;
        };
    };

    this.setSaveFolderChoice = function (folder) {
        this.setOptionValue('saveBehaviour','saveToSaveFolder');
        this.setSaveFolder(folder);
    };

    this.setSaveFolder = function (folder) {
        var txt = null;
        if (folder == null) {
            txt = '';
        } else {
            txt = folder;
        };
        this.setText('saveFolder', txt);
    };

    // --------------------------------------------------------------------------------
    // Helpers that translate between state types to
    // presentation types.

    this.getBooleanOption = function (field, optionsName) {
        var options = this.options[optionsName];
        var code = this.value[field];
        var trueOption = options[1];
        var isTrueOption = (code == trueOption.name)
        return isTrueOption;
    };

    this.getText = function (field) {
        var value = this.value[field];
        if (!value) value = '';
        return value;
    };

    this.getOptionValue = function (field) {
        var name = this.value[field];
        $.writeln('getOption ' + field + ' ' + ' -> ' + name);
        return name;
    };

    this.getOptionIndex = function (field) {
        var fld = this.field[field]
        fld.loadPrst(this.value);
        var idx = fld.getOptIdx();
        return idx;
    };

    this.getOptionFor = function (name, optionsName) {
        var options = this.options[optionsName];
        var idx = options.indexWhen(
            function (x) {
                return (x.name == name)
            }
        );
        return options[idx];
    };

    this.isOptionFieldValue = function (field, name) {
        var value = this.value[field];
        if (!value) value = '';
        return (name == value);
    };

    this.setBooleanOption = function (field, value, optionsName) {
        var options = this.options[optionsName];
        var option = options[value ? 1 : 0];
        var code = option.name;
        this.value[field] = code;
        $.writeln('setBooleanOption ' + field + ' ' + option.name);
    };

    this.setOptionValue = function (field, value) {
        var fld = this.field[field]
        fld.setValue(value);
        fld.updPreset(this.value);
    };

    this.setOptionIdx = function (field, idx) {
        var fld = this.field[field]
        fld.setOptIdx(idx);
        fld.updPreset(this.value);
    };

    this.setText = function (field, value) {
        if (value == null) value = '';
        this.value[field] = value.toString();
        $.writeln('setText ' + field + ' "' + value + '"');
    };

    // --------------------------------------------------------------------------------
    // Validation.

    this.rules = null;

    // Make the validation rules.
    // These positively state the requirements that must be met for the preset.
    // This means requirements both become visible to the user and the
    // messages serve as documentation for the script.
    // Note that brokenRules requires they must be ordered such that
    // fields are grouped together.

    this.makeRules = function () {

        this.rules = new Array();

        this.rules[this.rules.length] = new SimpleRule (
            'name', 'Name required.',
            function (val) {
                return (val.name != '')
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'name', 'Name must not contain < or >.',
            function (val) {
                return (
                    (val.name.indexOf("<") < 0)
                    && (val.name.indexOf(">") < 0)
                )
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'maxWidthPx', 'Width required.',
            function (val) {
                return (val.maxWidthPx != '')
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'maxWidthPx', 'Width must be a whole number of pixels.',
            function (val) {
                return  (Number(val.maxWidthPx))
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'maxHeightPx', 'Height required.',
            function (val) {
                return (val.maxHeightPx != '')
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'maxHeightPx', 'Height must be a whole number of pixels.',
            function (val) {
                return  (Number(val.maxHeightPx))
            }
        );
    
        this.rules[this.rules.length] = new SimpleRule (
            'saveQualityValue',
            'Quality of 0 to 100 required for Jpeg Quality Setting.',
            function (val) {
                var isValidOption = (
                    (val.saveQualityOption != 'jpegQuality')
                    || (
                        (0 <= Number(val.saveQualityValue))
                        && (100 >= Number(val.saveQualityValue))
                    )
                );
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'saveQualityValue',
            'Maximum filesize must be a whole number of kilobytes.',
            function (val) {
                var isValidOption = (
                    (val.saveQualityOption != 'maxFilesize')
                    || (
                        (0 < Number(val.saveQualityValue))
                    )
                );
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'saveBehaviour', 'An option for where to save must be specified.',
            function (val) {
                var isValidOption = (val.saveBehaviour != 'none');
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'listOfFiles', 'A save folder must be used when processing a list of files.',
            function (val) {
                var isValidOption = (
                    (val.inputOption != 'listOfFiles')
                    || (val.saveBehaviour == 'saveToSaveFolder')
                );
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'saveFolder', 'A folder to save to must be specified.',
            function (val) {
                var isValidOption = (
                    (val.saveBehaviour != 'saveToSaveFolder')
                    || (val.saveFolder != '')
                );
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'postResizeSharpeningOpt',
            'Opacity of 1 to 100 required for Bruce Fraser digital sharpening step.',
            function (val) {
                var isValidOption = (
                    (val.postResizeSharpening != 'sharpenForDigitalBFraser')
                    || (
                        (1 <= Number(val.postResizeSharpeningOpt))
                        && (100 >= Number(val.postResizeSharpeningOpt))
                    )
                );
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'canvasOpt1',
            'Top border is specified by number of pixels.',
            function (val) {
                var isValidOption = (
                    (val.placeOnCanvasBehaviour != 'borders-min')
                    || (0 <= Number(val.canvasOpt1))
                );
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'canvasOpt2',
            'Bottom border is specified by number of pixels.',
            function (val) {
                var isValidOption = (
                    (val.placeOnCanvasBehaviour != 'borders-min')
                    || (0 <= Number(val.canvasOpt2))
                );
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'canvasOpt3',
            'Left border is specified by number of pixels.',
            function (val) {
                var isValidOption = (
                    (val.placeOnCanvasBehaviour != 'borders-min')
                    || (0 <= Number(val.canvasOpt3))
                );
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'canvasOpt4',
            'Right border is specified by number of pixels.',
            function (val) {
                var isValidOption = (
                    (val.placeOnCanvasBehaviour != 'borders-min')
                    || (0 <= Number(val.canvasOpt4))
                );
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'canvasOpt1',
            'Scaling factor must be a percentage.',
            function (val) {
                var isValidOption = (
                    (val.placeOnCanvasBehaviour != 'scale-and-offset')
                    || (0 <= Number(val.canvasOpt1))
                );
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'canvasOpt2',
            'Horizontal shift must be a positive or negative number.',
            function (val) {
                var isValidOption = (
                    (val.placeOnCanvasBehaviour != 'scale-and-offset')
                    || (0 <= Number(val.canvasOpt2))
                );
                return isValidOption;
            }
        );

        this.rules[this.rules.length] = new SimpleRule (
            'canvasOpt3',
            'Vertical shift must be a positive or negative number.',
            function (val) {
                var isValidOption = (
                    (val.placeOnCanvasBehaviour != 'scale-and-offset')
                    || (0 <= Number(val.canvasOpt3))
                );
                return isValidOption;
            }
        );                    

        this.rules[this.rules.length] = new SimpleRule (
            'canvasOpt1',
            'Minimum height must be a non-zero positive number.',
            function (val) {
                var isValidOption = (
                    (val.placeOnCanvasBehaviour != 'limit-height')
                    || (1 <= Number(val.canvasOpt1))
                );
                return isValidOption;
            }
        );
    };

    this.brokenRules = function () {

        if (!this.rules)
            this.makeRules(); // Create when needed.

        var result = new Array();
        var rule = null;
        var lastInvalid = null;

        // Check each field for one breaking rule only.
        // This allows subsequent rules for a field not to 
        // have to re-test conditions that have checked already.
        // Assumes rules are ordered by field.

        for (var i = 0; i < this.rules.length; i++) {
            rule = this.rules[i];
            if (!lastInvalid || (lastInvalid.field != rule.field)) {
                if (!rule.isValid(this.value)) {
                    lastInvalid = rule;
                    result[result.length] = rule;
                }
            }
        };

        return result;
    };

    this.validate = function () {
        this.errors = this.brokenRules();
    };

    this.preSaveCheck = function () {
        // To run before save.

        var saveBehaviour = this.getOptionValue('saveBehaviour');

        switch (saveBehaviour) {

            case 'ask':

                // Clearing now instead of earlier provides memory effect.
                this.setText('saveFolder','');

                // Clearing now instead of earlier provides memory effect.
                this.setOptionValue('subFolderOption', 'none');

                break;

            case 'saveToSourceFolder':

                // Clearing now instead of earlier provides memory effect.
                this.setText('saveFolder','');

                break;
                
        };

        // Clearing now instead of earlier provides memory effect.
        var placeOnCanvasBehaviour = this.getOptionValue('placeOnCanvasBehaviour');

        switch (placeOnCanvasBehaviour) {
            case 'none':
            case 'fixed-canvas':
                this.setText('canvasOpt1', '');
            case 'limit-height':
                this.setText('canvasOpt2', '');
                this.setText('canvasOpt3', '');
        };

        if (placeOnCanvasBehaviour != 'borders-min') {
            this.setText('canvasOpt4', '');
        };
    };
};



// ================================================================================
// User Interface - Main Dialog
// Build and show the main dialog box.
// Handles all events on the dialog.
// ================================================================================

function showUiMain (mmdl) {

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
            stProcess:StaticText{bounds:[15,80,60,100] , text:'Process:', justify: 'right' },\
            etFilename:EditText{bounds:[70,80,570,100] , text:'' , helpTip: 'Enter the name for this image.'},\
            etToProcess:EditText{bounds:[70,80,570,100] , visible:false; text:'' ,properties:{readonly:true}, helpTip: 'The images located here will be processed.'},\
            btnBrowse:Button{bounds:[585,80,660,100] , text:'Browse...' , helpTip: 'Browse for batch of images to process.'},\
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
        this.stProcess.location.y = this.etFilename.location.y + stOffset;
        this.stProcess.location.x = this.etFilename.location.x - lblSpace - this.stProcess.size.width;
    };

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

    win.syncSummary = function  () {
        this.stDescription.text = mmdl.getCurrentPresetSummary();
    };

    // --------------------------------------------------------------------------------
    // Calculates the save folder and sets window text specific to the file options selected.
    // --------------------------------------------------------------------------------
    
    win.updateRunOptionSaveFolder = function () {

        // Using the currently selected preset...
        var preset = mmdl.getCurrentPreset();
        var currentImageOnly = (preset.inputOption == "currentImage");
        var savingToSourceFolder = (preset.saveBehaviour == 'saveToSourceFolder')
        var destinationTxt;

        // Updating this here, because we use the folder that was displayed to the user.
        mmdl.rnOpts.saveFolder = null;

        this.etToProcess.visible = false;
        this.etFilename.visible = false;

        if (mmdl.needSaveAsPrompt()) {
            
            // ---------------------------------
            // Prompt for save location
              
            this.etFilename.text = '';
            this.saveBtn.text = "Save As..."
            destinationTxt = "You will be prompted to choose a folder and enter an image name.";
            
        } else {
        
            // ---------------------------------
            // Save to a Folder

            //  Set options according to processing mode.
            if (currentImageOnly) {
                
                //  Single image mode.
                this.etFilename.visible = true;
                this.stProcess.text = 'Name:';
                this.saveBtn.text = "Save"
                
            } else {
                
                //  Batch image mode.
                this.etToProcess.visible = true;
                this.stProcess.text = 'Process:';
                this.saveBtn.text = "Run"
            };

            // Saving to a folder - curent image or batch?
            // Saving to the same folder as original or to a specified folder?
            
            var outputFolder = mmdl.getOutputFolder();
            mmdl.rnOpts.saveFolder = outputFolder;

            // Set the text that describes the folder location

            var subfolderTxt = mmdl.getSubfolderName();
            var destinationfolderTxt;
            if (savingToSourceFolder  && !outputFolder)
                if (subfolderTxt == "")
                    destinationfolderTxt = " the same folder as the original image."
                else
                    destinationfolderTxt = " subfolder: " + subfolderTxt
            else
                destinationfolderTxt = ": " + outputFolder.fsName;

            if (currentImageOnly)
                destinationTxt = 'Saving in' + destinationfolderTxt
            else
                if (preset.namingBehaviour == "original")
                    destinationTxt =  'Saving in' + destinationfolderTxt
                else
                    destinationTxt = 'Rename, save in' + destinationfolderTxt;         
        };

        this.cbOpenAfterSave.visible = !this.etToProcess.visible;
        this.btnBrowse.visible = this.etToProcess.visible;

        this.stFolderDisplay.text = destinationTxt;
    };

    // --------------------------------------------------------------------------------
    //  Synchronise everything on the main dialog.
    // --------------------------------------------------------------------------------
    
    win.syncUiMain = function () {
        // Loads the controls in the window with values and event handlers.
        //

        // Disable the handlers while re-syncing.
        this.ddPreset.onChange = null;
        this.cbOpenAfterSave.onClick = null;

        // Load the window with the settings information.
        this.ddPreset.removeAll();
        for (var i=0; i < mmdl.mvlu.preset.length; i++) 
            win.ddPreset.add('item', mmdl.mvlu.preset[i].name);

        this.ddPreset.selection = mmdl.getCurrentPresetIdx();

        this.syncSummary();
        this.updateRunOptionSaveFolder();
        this.syncMainValidationState();

        this.cbOpenAfterSave.value = mmdl.getBooleanOption(
            'afterSaveBehaviour', 'AfterSaveBehaviourOptions'
        );

        // Set the handlers.
        this.ddPreset.onChange = function () {
            win.cmdChangePreset();
        };
        this.cbOpenAfterSave.onClick = function () {
            mmdl.setBooleanOption(
                'afterSaveBehaviour',
                win.cbOpenAfterSave.value,
                'AfterSaveBehaviourOptions'
            );
        };

    };


    // --------------------------------------------------------------------------------
    // Create Event handlers for the other dialog controls
    // --------------------------------------------------------------------------------
    
    win.etFilename.onChanging = function () {
        mmdl.processFile = this.text;
        win.syncMainValidationState() 
    };
    win.btnDefinePreset.onClick = function () {
        win.cmdDefinePreset();
    };
    win.saveBtn.onClick = function () {
        win.cmdSave();
    };
    win.doneBtn.onClick = function () {
        win.cmdDone();
    };
    win.btnBrowse.onClick = function () {
        win.cmdBrowseBatch();
    };

    // --------------------------------------------------------------------------------
    // Synchronisation methods
    // --------------------------------------------------------------------------------

    win.syncMainValidationState = function() {
        this.saveBtn.enabled = mmdl.isReadyToRun();
    };

    // --------------------------------------------------------------------------------
    // Command methods
    // --------------------------------------------------------------------------------

    win.cmdChangePreset = function() {
        var idx = this.ddPreset.selection.index;
        mmdl.setCurrentPreset(idx);
        this.syncSummary();
        this.updateRunOptionSaveFolder();
        this.syncMainValidationState();
    };

    win.cmdBrowseBatch = function() {
        var usrBatchPath;
        var lastProcessed = mmdl.getLastProcessed();
        var lastTyp = (lastProcessed.constructor);
        // See: https://community.adobe.com/t5/premiere-pro/how-to-check-given-path-isfile-or-isdirectory-in-jsx/td-p/9159544?page=1

        if (mmdl.isListOfFilesMode()) {
            if (lastTyp == File)
                usrBatchPath = lastProcessed.openDlg ("Choose the file that lists the images to be processed:")
            else
                usrBatchPath = File.openDialog ("Choose the file that lists the images to be processed:");
        } else {
            if (lastTyp == Folder)
                usrBatchPath = lastProcessed.selectDlg ("Choose the folder to be processed:");
            else
                usrBatchPath = Folder.selectDialog ("Choose the folder to be processed:");
        };
        if (usrBatchPath) {
            mmdl.setProcessPath(usrBatchPath);
            this.etToProcess.text = mmdl.getProcessPathTxt();
            this.updateRunOptionSaveFolder();
            this.syncMainValidationState();
        };
    };

    win.cmdDefinePreset = function() {
        var idx = this.ddPreset.selection.index;
        var preset = mmdl.sttngs.userData.preset[idx];

        // Copy the preset for editing.
        var editedPreset = new Object();
        for(var fld in preset)
            editedPreset[fld] = preset[fld];

        var isDeletePresetAllowed = (1 < mmdl.sttngs.userData.preset.length);

        var winEditModel = new PresetEditModel(pstOpts, editedPreset);
        var uiPresetResult = showUiPreset(winEditModel, isDeletePresetAllowed);

        switch (uiPresetResult) {
            case -1:
                mmdl.removePreset();
                break;
            case 1:
                mmdl.savePreset(editedPreset);
                break;
        };

        this.syncUiMain();
    };

    win.cmdDone = function() {
        this.close(0);
    };

    win.cmdSave = function() {
        this.close(1);
    };

    // --------------------------------------------------------------------------------
    // Setup, show and return.
    // --------------------------------------------------------------------------------
    
     // Synchronise the dialog.
    win.syncUiMain ();

     // Show the dialog - returns when user has finished with it.
    var dialogResult = win.show();

    // Finalise run options every time.
    mmdl.finaliseRunOptions();

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

function showUiPreset (pmdl, isDeletePresetAllowed) {

    // --------------------------------------------------------------------------------
    // Preset dialog resource string
    // --------------------------------------------------------------------------------
    
    // Some StaticText have a text of "<size>" set so layout assigns a reasonable width.
    // etToProcess and etFilename seem like they are redundant, but not so, because
    // creation properies like 'ReadOnly' cannot be changed after the control is created.

    var uiPreset = // dialog resource object
        "dialog { \
            text: 'Define Preset',\
            orientation: 'column',\
            alignChildren: 'fill',\
            gName: Group {\
                orientation: 'row', \
                stName: StaticText{text:'Preset name:'},\
                etPresetName: EditText{properties: {name: 'uiPresetName'}, characters: 50, text:'', helpTip: 'Change the name for a new preset.'}\
            },\
            gImageSettings: Panel { \
                text:'Requirements:',\
                orientation: 'column',\
                alignChildren: 'fill',\
                margins: 15,\
                ddlInputOption:DropDownList{properties: {name: 'uiInputOption'}, helpTip: 'Choose which images are processed.'},\
                g1: Group { \
                    orientation: 'row',\
                    alignChildren: 'fill',\
                    g0: Group {\
                        alignChildren: ['left','center'],\
                        ddlSaveQualityOption:DropDownList{properties: {name: 'uiSaveQualityOption'}, helpTip: 'Choose the save quality.'},\
                        etSaveQualityValue:EditText{ properties: {name: 'uiSaveQualityValue'}, characters: 5, text:'' , helpTip: 'Enter the quality value.'},\
                        g2: Group {\
                            alignChildren: ['right','center'],\
                            stProfile:StaticText{text:'Profile:' },\
                            etProfile:EditText{ properties: {name: 'uiColourProfile', readonly:true}, characters: 25, text:'sRGB IEC61966-2.1' , helpTip: 'ICC Colour space to convert to.'}\
                        }\
                    },\
                    cbSmallImageWarning:Checkbox{\
                        properties: {name: 'uiSmallImageWarning'}, \
                        alignment: ['right','center'],\
                        text:'Warn if original image is too small',\
                        helpTip: 'Warns you if your image is smaller than both the maximum height and maximum width.'\
                    }\
                },\
                g0: Group { \
                    orientation: 'row',\
                   alignChildren: 'fill',\
                   g0: Group {\
                       size: [180,25],\
                       alignChildren: ['left','center'],\
                       statictext1:StaticText{text:'Max. width (pixels):'},\
                       etMaxWidthPx:EditText{ properties: {name: 'uiMaxWidthPx'}, characters: 5, text:'1024' , helpTip: 'The image will be scaled to fit within this limit.'}\
                   },\
                   g1: Group {\
                       size: [180,25],\
                       alignChildren: ['left','center'],\
                       statictext2:StaticText{text:'Max. height (pixels):' },\
                       etMaxHeightPx:EditText{ properties: {name: 'uiMaxHeightPx'}, characters: 5, text:'768' , helpTip: 'The image will be scaled to fit within this limit.'}\
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
                    ddlReductionMethodOption:DropDownList{properties: {name: 'uiReductionMethodOption'}, helpTip: 'The method used to resize the image. Photoshop describes Bicubic Sharper as best for reduction.'},\
                    gSharpeningOptions: Group { \
                        orientation: 'row',\
                        alignChildren: 'fill',\
                        ddlpostResizeSharpening:DropDownList{properties: {name: 'uiPostResizeSharpening'}, helpTip: 'Sharpening after resize.'},\
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
                            statictext1:StaticText{ properties: {name: 'uiCanvasOpt1Txt'}, size: [80, 20], justify: 'right', text:'<size>' },\
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
                        rbInFolder:RadioButton{properties: {name: 'uiSpecificFolderOption'}, text:'This folder:' , helpTip: 'Always use your choosen folder.'}\
                    },\
                    btnBrowse:Button{properties: {name: 'uiBrowse'}, alignment: ['right','bottom'], text:'Choose folder...' , helpTip: 'Browse for a folder.'}\
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
            stValidationText:StaticText{ properties: {name: 'uiValidationText'}, justify: 'right', text:'' },\
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

    // Populate list boxes.
    var populateListBox = function (listBox, field) {
        var options = pmdl.field[field].options;
        for (var i=0; i < options.length; i++) {
            var obj = options[i];
            var listItem = listBox.add('item', obj.text);
        };
    };

    // Load list boxes.
    populateListBox(ui.uiInputOption, 'inputOption');
    populateListBox(ui.uiSaveQualityOption, 'saveQualityOption');
    populateListBox(ui.uiImageActionOne, 'imageActionOne');
    populateListBox(ui.uiplacementAction, 'placementAction');
    populateListBox(ui.uibackgroundActionLast, 'backgroundActionLast');
    populateListBox(ui.uiReductionMethodOption, 'reductionMethodOption');
    populateListBox(ui.uiNamingBehaviour, 'namingBehaviour');
    populateListBox(ui.uiImageRotationOptions, 'imageRotationOptions');
    populateListBox(ui.uiPlaceOnCanvasBehaviour, 'placeOnCanvasBehaviour');
    populateListBox(ui.uiBackgroundOptions, 'backgroundOptions');
    populateListBox(ui.uiPostResizeSharpening, 'postResizeSharpening');
    populateListBox(ui.uiSubfolderOption, 'subFolderOption');

    // --------------------------------------------------------------------------------
    // Preset dialog event handlers
    // --------------------------------------------------------------------------------
    
    var setEventHandlers = function () {

        ui.uiAskOnSaveOption.onClick = function () {
            pmdl.setOptionValue('saveBehaviour', 'ask');
            win.syncPresetSaveBehaviour();
            win.syncPresetValidation();
        };

        ui.uiSaveToSourceFolderOption.onClick = function ()  {
            pmdl.setOptionValue('saveBehaviour', 'saveToSourceFolder');
            win.syncPresetSaveBehaviour();
            win.syncPresetValidation();
        };

        ui.uiSpecificFolderOption.onClick = function () {
            pmdl.setOptionValue('saveBehaviour', 'saveToSaveFolder');
            win.syncPresetSaveBehaviour();
            win.syncPresetValidation();
        };

        ui.uiBrowse.onClick = function () {

            // Choose folder.
            var startFolder;
            startFolder = Folder(settings.userData.lastSaveFolder);
            startFolder.changePath("..");
            var usrFolder = startFolder.selectDlg ("Choose a folder to store your images:");
            if (usrFolder) {
                pmdl.setSaveFolderChoice(usrFolder);
                win.syncPresetSaveBehaviour();
            };

            win.syncPresetValidation();
        };

        ui.uiPresetName.onChanging = function () {
            pmdl.setText('name', this.text);
            win.syncPresetValidation();
        };

        ui.uiInputOption.onChange = function () {
            pmdl.setInputOption(this.selection.index);
            win.syncPresetSaveBehaviour();
            win.syncPresetValidation();
        };

        ui.uiSaveQualityOption.onChange = function () {
            pmdl.setOptionIdx('saveQualityOption', this.selection.index);
            win.syncPresetValidation();
        };

        ui.uiSaveQualityValue.onChanging = function () {
            pmdl.setText('saveQualityValue', this.text);
            win.syncPresetValidation();
        };

        ui.uiReductionMethodOption.onChange = function () {
            pmdl.setOptionIdx('reductionMethodOption', this.selection.index);
            win.syncPresetValidation();
        };

        ui.uiSubfolderOption.onChange = function () {
            pmdl.setOptionIdx('subFolderOption', this.selection.index);
        };

        ui.uiNamingBehaviour.onChange = function () {
            pmdl.setOptionIdx('namingBehaviour', this.selection.index);
            win.syncPresetValidation();
        };

        ui.uiBackgroundOptions.onChange = function () {
            pmdl.setOptionIdx('backgroundOptions', this.selection.index);
        };

        ui.uiPlaceOnCanvasBehaviour.onChange = function () {
            pmdl.setOptionIdx('placeOnCanvasBehaviour', this.selection.index);
            win.syncPresetPresentation();
            win.syncPresetValidation();
        };

        ui.uiImageRotationOptions.onChange = function () {
            pmdl.setOptionIdx('imageRotationOptions', this.selection.index);
        };

        ui.uiPostResizeSharpening.onChange = function () {
            pmdl.setOptionIdx('postResizeSharpening', this.selection.index);
            win.syncPresetPostResizeSharpening();
            win.syncPresetValidation();
        };

        ui.uiPostResizeSharpeningOpt.onChanging = function () {
            pmdl.setText('postResizeSharpeningOpt', this.text);
            win.syncPresetValidation();
        };

        ui.uiImageActionOne.onChange = function () {
            pmdl.setOptionIdx('imageActionOne', this.selection.index);
        };
        ui.uiplacementAction.onChange = function () {
            pmdl.setOptionIdx('placementAction', this.selection.index);
        };

        ui.uibackgroundActionLast.onChange = function () {
            pmdl.setOptionIdx('backgroundActionLast', this.selection.index);
        };

        ui.uiMaxWidthPx.onChanging = function () {
            pmdl.setText('maxWidthPx', this.text);
            win.syncPresetValidation();
        };

        ui.uiMaxHeightPx.onChanging = function () {
            pmdl.setText('maxHeightPx', this.text);
            win.syncPresetValidation();
        };

        ui.uiPresetNotes.onChanging = function () {
            pmdl.setText('presetNotes', this.text);
        };

        ui.uiSmallImageWarning.onClick = function () {
            pmdl.setBooleanOption('smallImageCheck',this.value,'SmallImageWarningOptions')
        };

        ui.uiDelBtn.onClick = function () {
            win.close(-1);
        };
        
        ui.uiCanvasOpt1.onChanging = function () {
            pmdl.setText('canvasOpt1', ui.uiCanvasOpt1.text);
            win.syncPresetValidation();
        };

        ui.uiCanvasOpt2.onChanging = function () {
            pmdl.setText('canvasOpt2', ui.uiCanvasOpt2.text);
            win.syncPresetValidation();
        };

        ui.uiCanvasOpt3.onChanging = function () {
            pmdl.setText('canvasOpt3', ui.uiCanvasOpt3.text);
            win.syncPresetValidation();
        };

        ui.uiCanvasOpt4.onChanging = function () {
            pmdl.setText('canvasOpt4', ui.uiCanvasOpt4.text);
            win.syncPresetValidation();
        };
    };
      
    // --------------------------------------------------------------------------------
    // Synchronisation methods
    // --------------------------------------------------------------------------------

    win.syncPresetPostResizeSharpening = function () {

        var isVisible = pmdl.isOptionFieldValue(
            'postResizeSharpening',
            'sharpenForDigitalBFraser'
        );

        ui.uiPostResizeSharpeningOpt.visible = isVisible;
        ui.uiPostResizeSharpeningOptTxt.visible = isVisible;
    };

    win.syncPresetPresentation = function () {

        var isNoBehaviour = pmdl.isOptionFieldValue(
            'placeOnCanvasBehaviour',
            'none'
        );

        var isBordersMin = pmdl.isOptionFieldValue(
            'placeOnCanvasBehaviour',
            'borders-min'
        );

        var isScaleAndOffset = pmdl.isOptionFieldValue(
            'placeOnCanvasBehaviour',
            'scale-and-offset'
        );

        var isLimitHeight = pmdl.isOptionFieldValue(
            'placeOnCanvasBehaviour',
            'limit-height'
        );

        ui.uiBackgroundOptions.visible = (!isNoBehaviour);

        ui.uiCanvasOpt1.visible = (isBordersMin || isScaleAndOffset || isLimitHeight);
        ui.uiCanvasOpt1Txt.visible = ui.uiCanvasOpt1.visible

        ui.uiCanvasOpt2.visible = (isBordersMin || isScaleAndOffset);
        ui.uiCanvasOpt2Txt.visible = ui.uiCanvasOpt2.visible

        ui.uiCanvasOpt3.visible = (isBordersMin || isScaleAndOffset);
        ui.uiCanvasOpt3Txt.visible = ui.uiCanvasOpt3.visible

        ui.uiCanvasOpt4.visible = (isBordersMin);
        ui.uiCanvasOpt4Txt.visible = ui.uiCanvasOpt4.visible;

        if (isBordersMin) {
            ui.uiCanvasOpt1Txt.text = "Top";
            ui.uiCanvasOpt2Txt.text = "Bottom";
            ui.uiCanvasOpt3Txt.text = "Left";
            ui.uiCanvasOpt4Txt.text = "Right";
        };

        if (isScaleAndOffset) {
            ui.uiCanvasOpt1Txt.text = "Scale%";
            ui.uiCanvasOpt2Txt.text = "x-shift";
            ui.uiCanvasOpt3Txt.text = "y-shift";
        };

        if (isLimitHeight) {
            ui.uiCanvasOpt1Txt.text = "Min height (px)";
        };
    };

    win.syncPresetSaveBehaviour = function () {

        var currentImageOnly = (pmdl.isOptionFieldValue('inputOption', 'currentImage'));

        var saveBehaviourOption = pmdl.getOptionValue('saveBehaviour');

        ui.uiAskOnSaveOption.enabled = (currentImageOnly);

        ui.uiAskOnSaveOption.value = (saveBehaviourOption == 'ask');
        ui.uiSaveToSourceFolderOption.value = (saveBehaviourOption == 'saveToSourceFolder');
        ui.uiSpecificFolderOption.value = (saveBehaviourOption == 'saveToSaveFolder');
    
        ui.uiSaveFolder.text = pmdl.getSaveFolder();

        ui.uiSaveFolder.visible = (ui.uiSpecificFolderOption.value);
        ui.uiSubfolderOption.visible = (!ui.uiAskOnSaveOption.value);
        ui.uiSubfolderOptionTxt.visible = ui.uiSubfolderOption.visible;

        ui.uiNamingBehaviour.selection
            = pmdl.getOptionIndex('namingBehaviour');

        ui.uiNamingBehaviour.visible = (!currentImageOnly)
    };

    win.syncPresetValidation = function () {

        var currentImageOnly = (pmdl.isOptionFieldValue('inputOption', 'currentImage'));
        ui.uiSaveRepeatWarning.visible = (
            (pmdl.isOptionFieldValue('saveQualityOption', 'maxFilesize'))
            && (!currentImageOnly)
        );

        pmdl.validate();
        var problems = pmdl.errors;
        var errorText = '';
        if (problems.length > 0) {
            errorText = problems.length + ' to fix.  ' + problems[0].description;
        };

        var isProblems = (problems.length > 0);
        ui.uiOkBtn.enabled = (!isProblems);
        ui.uiValidationText.text = errorText
        ui.uiValidationText.visible = (isProblems)
    };


    // --------------------------------------------------------------------------------
    // Load up the window
    // --------------------------------------------------------------------------------

    ui.uiPresetName.text = pmdl.getText('name');

    // Requirements box.
    ui.uiInputOption.selection = pmdl.getOptionIndex('inputOption');
    ui.uiColourProfile.text = pmdl.getText('colourProfileName');
    ui.uiMaxWidthPx.text = pmdl.getText('maxWidthPx');
    ui.uiMaxHeightPx.text = pmdl.getText('maxHeightPx');
    ui.uiSaveQualityOption.selection = pmdl.getOptionIndex('saveQualityOption');
    ui.uiSaveQualityValue.text = pmdl.getText('saveQualityValue');
    ui.uiSmallImageWarning.value = pmdl.getBooleanOption('smallImageCheck', 'SmallImageWarningOptions');
    ui.uiPresetNotes.text = pmdl.getText('presetNotes');

    // Preparation tab.
    ui.uiImageActionOne.selection = pmdl.getOptionIndex('imageActionOne');

    // Resizing tab.
    ui.uiImageRotationOptions.selection = pmdl.getOptionIndex('imageRotationOptions');
    ui.uiReductionMethodOption.selection = pmdl.getOptionIndex('reductionMethodOption');
    ui.uiPostResizeSharpening.selection
        = pmdl.getOptionIndex('postResizeSharpening');
    ui.uiPostResizeSharpeningOpt.text
        = pmdl.getText('postResizeSharpeningOpt');
    win.syncPresetPostResizeSharpening();

    // Presentation tab.
    ui.uiplacementAction.selection = pmdl.getOptionIndex('placementAction');
    ui.uiPlaceOnCanvasBehaviour.selection = pmdl.getOptionIndex('placeOnCanvasBehaviour');
    ui.uiBackgroundOptions.selection = pmdl.getOptionIndex('backgroundOptions');
    ui.uiCanvasOpt1.text = pmdl.getText('canvasOpt1');
    ui.uiCanvasOpt2.text = pmdl.getText('canvasOpt2');
    ui.uiCanvasOpt3.text = pmdl.getText('canvasOpt3');
    ui.uiCanvasOpt4.text = pmdl.getText('canvasOpt4');
    win.syncPresetPresentation();

    // Finally tab.
    ui.uibackgroundActionLast.selection = pmdl.getOptionIndex('backgroundActionLast');
    
    // "Where to save" box.
    win.syncPresetSaveBehaviour();
    ui.uiSubfolderOption.selection =
        pmdl.getOptionIndex('subFolderOption');

    // Bottom controls.
    ui.uiDelBtn.enabled = isDeletePresetAllowed;
    win.syncPresetValidation();

    setEventHandlers();

    // Determine placement of window.
    // 1.18: Creating a location object prevents window showing off screen.
    win.location = [80, 100]; // Ensure locatoin is created (prevent's showing off screen).

    // Display the dialog - returns when ok or cancel is clicked.
    var ret = win.show();
    
    if (1==ret) {
        
        // Finalise preset changes.
        pmdl.preSaveCheck();
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

function getVersion() {
    // Return the version of Photoshop;
    //
    return parseInt(app.version);
}

function hasJpgSuffix (s) {
    var jpgExtension = ".jpg";
    var lCaseName = s;
    lCaseName = lCaseName.toLowerCase();
    var idx = lCaseName.lastIndexOf( jpgExtension )
    var hasSuffix = false;
    if (idx >= 0)
        hasSuffix = ( idx == (s.length - jpgExtension.length) );
    return hasSuffix;
};

function hasJpgExtension (f) {
    return hasJpgSuffix(f.name)
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

    var placeMode = param.PlaceOnCanvasBehaviourOptions;

    // We must create a new image with these modes.
    if (
        (placeMode == "borders-min")
        || (placeMode == "scale-and-offset")
    ) return false;

    var extOk = hasJpgExtension(activeDocument.fullName);

    var widthOk = false;
    var heightOk = false;
    if (placeMode == "fixed-canvas") {
        widthOk = (activeDocument.width == param.width);
        heightOk = (activeDocument.height == param.height);
    } else {
        widthOk = (activeDocument.width <= param.width);
        heightOk = (activeDocument.height <= param.height);
    }

    if (placeMode == "limit-height") {
        var minHeight = new UnitValue( (param.canvasOpt1 =="" ? "1" : param.canvasOpt1) + " pixels" );
        heightOk = (heightOk && (activeDocument.height >= minHeight))
    }

    var depthOk = (activeDocument.bitsPerChannel == BitsPerChannelType.EIGHT);

    var profileOk = ((activeDocument.colorProfileType != ColorProfile.NONE) && (activeDocument.colorProfileName == param.colourProfile));

    var noRotation = (param.imageRotationOptions != "none")

    var fileSizeOk = (
        (
            (param.saveQualityOption = 'jpegQuality')
            && (param.saveQualityValue = '100')
        )
        || (
            (param.saveQualityOption = 'maxFilesize')
            && (activeDocument.fullName.length <= (param.saveQualityValue * 1024))
        )
    );

    var itComplies = (unModified && extOk && widthOk && heightOk && depthOk && profileOk && fileSizeOk && noRotation);

    return itComplies;
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
    // Creates a flat duplicate of the current document.
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
    // Cannot determine if image already complies with requirements if this option is used - see compliesWithRequirements
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
    
        // Size the canvas and place the image.
        switch (param.placeOnCanvasBehaviour) {
            case 'fixed-canvas':
                activeDocument.resizeCanvas(param.width, param.height);
                break;
            case 'limit-height':
                var minHeight = new UnitValue( (param.canvasOpt1 =="" ? "1" : param.canvasOpt1) + " pixels" );
                if (activeDocument.height < minHeight) {
                    activeDocument.resizeCanvas(param.width, minHeight);
                } else {
                    if (activeDocument.height < param.height) {
                        activeDocument.resizeCanvas(param.width, activeDocument.height);
                    } else {
                        activeDocument.resizeCanvas(param.width, param.height);
                    }
                }
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
            switch (runOptions.imageParameters.saveQualityOption) {
                case "jpegQuality":
                    psTool.saveForWebAsJPEG(imageFile, imageParameters.saveQualityValue);
                    break;
                case "maxFilesize":
                    psTool.saveJPEGLimitFilesizeKb(imageFile, imageParameters.saveQualityValue);
                    break;
            };
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

    // Something to read a file of filenames.
    var readListFile = function (listFile) {
        // Returns the stored configuration settings, or default settings.
        // If you add more options, then you will need to deal with missing elements from configurations already stored on user's computers.
        var str, ln, imgFile, files;
        var fileIsOpen = listFile.open('r')
        if (listFile.error != "")
            throw listFile.error;
        files = new Array();
        ln = 0;
        while (!listFile.eof) {
            ln +=  1;
            str = listFile.readln();
            imgFile = new File(str);
            if (imgFile.constructor != File)
                throw "Error on line " + ln + ": expecting a path to a file.";
            files[files.length] = imgFile;
        };
        if (fileIsOpen)
            listFile.close();
        return files;
    };


    //  Option objects.
    mnOpts = new MainOptions ();
    pstOpts = new PresetOptions ();

    // Save current user preferences.
    psTool.saveSettings();
            
    //record original ruler preference before doing anything
    var startRulerUnits = app.preferences.rulerUnits

    var settings = new Settings();
    var runOptions = new Object();

    settings.getConfiguration();
    var mainWinEditModel = new MainEditModel(mnOpts, runOptions, settings);
    var uiMainResult = showUiMain(mainWinEditModel);
    settings.putConfiguration(); // Have to save changes after Done.
    
    if (1 != uiMainResult)
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
            if (! runOptions.inputName)
                throw "Unexpected error: Name has no value."
            if (! runOptions.saveFolder.exists)
                runOptions.saveFolder.create();

            imageFile = new File(runOptions.saveFolder);
            if (hasJpgSuffix(runOptions.inputName))
                imageFile.changePath(runOptions.inputName)
            else
                imageFile.changePath(runOptions.inputName + ".jpg");
        }
        else {
            imageFile = promptForJpgSaveFile("Choose a folder and enter the image title as the file name.");
            if (! imageFile)
                throw "Script cancelled.";
        };
    
        // Save for Web changes spaces to hypens - do it here so as not to lose track of the new file.
        var tmp = new File(imageFile.path)
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

        // BATCH PROCESSING MODE

        var filesToProcess;
        var imageFile,saveFile;
        var someMissing, someAlreadyExist, someWillOverwriteOriginal, someExceedFilesize, someTooSmall;

        if (runOptions.inputOption == "listOfFiles") {

            var inputListFile = new File(runOptions.inputName);
            if (!inputListFile.exists)
                throw "The file containing the list of images does not exist.";

            // Read file into array.
            filesToProcess = readListFile(inputListFile);

        } else {
            // All images in a folder.
            var inputFolder = new Folder(runOptions.inputName);
            filesToProcess = psTool.getOpenableFiles(inputFolder);
        };

         var namingSubFn = function (imageFile, prefix, suffix) {
            var tmp = unescape(imageFile.name).replace(/ /g,"-");
            var saveFile = new File(runOptions.saveFolder)
            saveFile.changePath(prefix + tmp.substr(0,tmp.lastIndexOf('.')) + suffix + '.jpg');
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
            if (!imageFile.exists)
                someMissing = true;
            saveFile = namingFn(imageFile);
            var idx = filesToProcess.indexWhen(
                function (x) {
                    return (x.fullName == saveFile.fullName)
                }
            ); // Search all original files for this name.
            if (idx >= 0)
                someWillOverwriteOriginal = true;
            if (saveFile.exists)
                someAlreadyExist = true;
            outputFiles[i] = saveFile;
        };

        // Check they all still exist.
        if (someMissing) {
            alert ("Some files are missing. Process cancelled.");
            throw "Script cancelled.";
        };

        // Check that they won't overwrite orginal.
        if (someWillOverwriteOriginal) {
            alert ("Some original files would be replaced by continuing. Process cancelled. Consider using a different naming option or using a subfolder.");
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

catch( e ) {
    if (e != "Script cancelled."){
        // Give a generic alert on errors.
        var tmp; tmp = e.line; if (!tmp) tmp = "" else tmp = " : " + tmp
        var msg = "Error: " + e + tmp;
        $.writeln('Érror: ' + msg);
        alert( msg , "Error while running script", true);
    }
}

finally {
        //restore the original preferences
        app.preferences.rulerUnits = startRulerUnits;
};
