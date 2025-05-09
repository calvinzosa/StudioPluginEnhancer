!macro NSIS_HOOK_POSTUNINSTALL
  RMDir /r "$AppData\StudioPluginEnhancer"
  RMDir /r "$LocalAppData\StudioPluginEnhancer"
!macroend
