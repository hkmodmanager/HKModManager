# **H**ollow **K**night **M**od **M**anager

# 已停止维护，请使用[Scarab+](https://themulhima.github.io/Scarab/)
# Maintenance has been stopped, please use [Scarab+](https://themulhima.github.io/Scarab/)

A Hollow Knight Mods Manager for version 1.5

## Featured features

### 1. Mods filter

Allows filtering commands by filling the search bar with them
For example, `:author=HKLab tag=Boss` will filter all modbosses whose author is `HKLab`

Currently supported filters:

```
:author=<Author Name>    Filter authors

:tag=<Tag Name>   Filter Mods categories, valid values: Boss | Cosmetic | Expansion | Gameplay | Library | Utility


```

### 2. Mods file separation

HKMM will strip the Mods files from the `hollow_knight_Data/Managed/Mods` folder and remap the stripped Mods files to the `hollow_knight_Data/Managed/Mods` folder at runtime.This means that mods files are not mixed with extra files added by the user themselves, and the files added by the user can be preserved when the mods are uninstalled.

**For users, the additional mods file placement remains the same as before.**

### 3. Support Modpack
