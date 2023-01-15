
# **H**ollow **K**night **M**od **M**anager

一个适用于1.5版本的空洞骑士Mods管理器

~~本来是想去维护Scarab的，但是被那几个放了3个月的pr劝退了~~

## 特色功能

### 1. Mods筛选

允许向搜索栏中填入筛选命令，如`:author=HKLab tag=Boss`将筛选所有作者为`HKLab`的modboss

目前支持的筛选器：

```
:author=<Author Name>    筛选作者

:tag=<Tag Name>   筛选Mods类别，有效值： Boss | Cosmetic | Expansion | Gameplay | Library | Utility

:sort=size    将筛选结果按Mod大小排序

:sort=lastupdate    将筛选结果按Mod最后更新时间排序

```

### 2. 数据文件分离

HKMM会将Mods文件从`hollow_knight_Data/Managed/Mods`文件夹中剥离，在运行时将剥离的Mods文件重新映射至`hollow_knight_Data/Managed/Mods`文件夹中。这意味着Mods文件不会和使用者自己添加的额外文件混在一起，并且可以在卸载Mods时**保留**使用者自己添加的文件。

**对于使用者而言，额外的Mods文件放置位置依然和以前一样。**

### 3. 从本地/Scarab导入Mods

为了帮助使用者从Scarab迁移至HKMM，提供了从本地/Scarab导入Mods的功能。导入Mods时，HKMM会对Mods进行完整性校验，使用者可决定是否补全Mods文件。

### 4. 切换下载源

因为一些懂得都懂的原因，大陆内Github的速度真的是一言难尽。

由此，HKMM提供了Github以外另一个下载源——hk-modlinks.clazex.net
来源： [ScarabCN](https://github.com/Clazex/ScarabCN)，现已停止维护

### 5. 中文支持

这个肯定的

### 6. 支持离线启动

除了第一次启动

# 感谢

[Clazex](https://github.com/Clazex)提供的下载源 hk-modlinks.clazex.net
