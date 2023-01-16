# **H**ollow **K**night **M**od **M**anager

A Hollow Knight Mods Manager for version 1.5

## Featured features

### 1. Mods filter

Allows filtering commands by filling the search bar with them
For example, `:author=HKLab tag=Boss` will filter all modbosses whose author is `HKLab`

Currently supported filters:

```
:author=<Author Name>    Filter authors

:tag=<Tag Name>   Filter Mods categories, valid values: Boss | Cosmetic | Expansion | Gameplay | Library | Utility

:sort=size    Sort the filtered results by mod size

:sort=lastupdate    Sort the filtered results by when the mod was last updated

```

### 2. Mods file separation

HKMM will strip the Mods files from the `hollow_knight_Data/Managed/Mods` folder and remap the stripped Mods files to the `hollow_knight_Data/Managed/Mods` folder at runtime.This means that mods files are not mixed with extra files added by the user themselves, and the files added by the user can be preserved when the mods are uninstalled.

**For users, the additional mods file placement remains the same as before.**

### 3. Import Mods from Local/Scarab

To help users migrate from Scarab to HKMM, the ability to import Mods from local/Scarab is provided.When importing Mods, HKMM checks the integrity of the Mods, and users can decide whether to complete the Mods file.
