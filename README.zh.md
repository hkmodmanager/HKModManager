
# **H**ollow **K**night **M**od **M**anager

一个适用于1.5版本的空洞骑士Mods管理器

## 特色功能

### 1. Mods筛选

允许向搜索栏中填入筛选命令，如`:author=HKLab tag=Boss`将筛选所有作者为`HKLab`的modboss

目前支持的筛选器：

```
:author=<Author Name>    筛选作者

:tag=<Tag Name>   筛选Mods类别，有效oss | Cosmetic | Expansion | Gameplay | Library | Utility

```

### 2. 数据文件分离

HKMM会将Mods文件从`hollow_knight_Data/Managed/Mods`文件夹中剥离，在运行时将剥离的Mods文件重新映射至`hollow_knight_Data/Managed/Mods`文件夹中。这意味着Mods文件不会和使用者自己添加的额外文件混在一起，并且可以在卸载Mods时**保留**使用者自己添加的文件。

**对于使用者而言，额外的Mods文件放置位置依然和以前一样。**

### 3. 支持Modpack

### 3. 中文支持

### 4. 支持离线启动

除了第一次启动

