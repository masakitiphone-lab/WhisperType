#define MyAppName "WhisperType"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "WhisperType"
#define MyAppExeName "whisper-type.exe"
#define MyAppSourceExe "C:\Users\Masaya Kitagawa\APP DEV\whisper-type\src-tauri\target\release\whisper-type.exe"
#define MyAppIcon "C:\Users\Masaya Kitagawa\APP DEV\whisper-type\src-tauri\icons\icon.ico"

[Setup]
AppId={{D08D4C79-4B4F-4D72-8E2A-8D9D5A39B961}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL=https://whispertype.app
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
UninstallDisplayIcon={app}\{#MyAppExeName}
OutputDir=dist
OutputBaseFilename=WhisperType_{#MyAppVersion}_InnoSetup_v13
SetupIconFile={#MyAppIcon}
WizardStyle=modern
ShowLanguageDialog=yes
UsePreviousLanguage=no
LanguageDetectionMethod=uilanguage
Compression=lzma2/ultra64
SolidCompression=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
DisableDirPage=no
AllowNoIcons=yes
UsePreviousAppDir=no
UsePreviousGroup=yes
UsePreviousTasks=yes
CloseApplications=yes
RestartApplications=no
ChangesAssociations=no
SetupLogging=yes
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=WhisperType Installer

[Languages]
Name: "japanese"; MessagesFile: "compiler:Languages\Japanese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"

[Files]
Source: "{#MyAppSourceExe}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; WorkingDir: "{app}"

[Run]
Filename: "{app}\{#MyAppExeName}"; Flags: nowait skipifsilent

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    RegWriteStringValue(HKCU, 'Software\Classes\whispertype', '', 'URL:WhisperType Protocol');
    RegWriteStringValue(HKCU, 'Software\Classes\whispertype', 'URL Protocol', '');
    RegWriteStringValue(HKCU, 'Software\Classes\whispertype\DefaultIcon', '', ExpandConstant('{app}\{#MyAppExeName},0'));
    RegWriteStringValue(HKCU, 'Software\Classes\whispertype\shell\open\command', '', ExpandConstant('"{app}\{#MyAppExeName}" "%1"'));
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    RegDeleteKeyIncludingSubkeys(HKCU, 'Software\Classes\whispertype');
  end;
end;
