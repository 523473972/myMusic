import AppBar from "@/components/base/appBar";
import { showDialog } from "@/components/dialogs/useDialog";
import { showPanel } from "@/components/panels/usePanel.ts";
import { SortType } from "@/constants/commonConst.ts";
import { useI18N } from "@/core/i18n";
import MusicSheet, { useSheetItem } from "@/core/musicSheet";
import PluginManager from "@/core/pluginManager";
import { ROUTE_PATH, useParams } from "@/core/router";
import { default as Toast, default as toast } from "@/utils/toast";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";

export default function () {
    const navigation = useNavigation<any>();
    const { id = "favorite" } = useParams<"local-sheet-detail">();
    const musicSheet = useSheetItem(id);
    const { t } = useI18N();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 检查歌单是否支持刷新
    const canRefresh = MusicSheet.canRefreshSheet(id);

    return (
        <>
            <AppBar
                menu={[
                    {
                        icon: "arrow-path",
                        title: t("sheetDetail.refreshSheet"),
                        show: canRefresh,
                        async onPress() {
                            if (isRefreshing) {
                                Toast.warn(t("sheetDetail.refreshing"));
                                return;
                            }
                            setIsRefreshing(true);
                            Toast.success(t("sheetDetail.refreshing"));
                            try {
                                const result = await MusicSheet.refreshSheet(id, PluginManager);
                                if (result.success) {
                                    if (result.added > 0) {
                                        Toast.success(t("sheetDetail.refreshSuccess", { count: result.added }));
                                    } else {
                                        Toast.success(t("sheetDetail.refreshNoNew"));
                                    }
                                } else {
                                    // 根据错误码显示对应的国际化错误信息
                                    const errorKey = result.errorCode
                                        ? `sheetDetail.refreshError.${result.errorCode}`
                                        : "sheetDetail.refreshFailed";
                                    Toast.warn(t(errorKey) || t("sheetDetail.refreshFailed"));
                                }
                            } catch (e: any) {
                                Toast.warn(e?.message || t("sheetDetail.refreshFailed"));
                            } finally {
                                setIsRefreshing(false);
                            }
                        },
                    },
                    {
                        icon: "pencil-outline",
                        title: t("sheetDetail.editSheetInfo"),
                        onPress() {
                            showPanel("EditMusicSheetInfo", {
                                musicSheet: musicSheet,
                            });
                        },
                    },
                    {
                        icon: "pencil-square",
                        title: t("sheetDetail.batchEditMusic"),
                        onPress() {
                            navigation.navigate(ROUTE_PATH.MUSIC_LIST_EDITOR, {
                                musicList: musicSheet.musicList,
                                musicSheet: musicSheet,
                            });
                        },
                    },
                    {
                        icon: "sort-outline",
                        title: t("sheetDetail.sortMusic"),
                        onPress() {
                            showDialog("RadioDialog", {
                                content: [
                                    {
                                        value: SortType.Title,
                                        label: t("sheetDetail.sortMusicOption.byTitle"),
                                    },
                                    {
                                        value: SortType.Artist,
                                        label: t("sheetDetail.sortMusicOption.byArtist"),
                                    },
                                    {
                                        value: SortType.Album,
                                        label: t("sheetDetail.sortMusicOption.byAlbum"),
                                    },
                                    {
                                        value: SortType.Newest,
                                        label: t("sheetDetail.sortMusicOption.newest"),
                                    },
                                    {
                                        value: SortType.Oldest,
                                        label: t("sheetDetail.sortMusicOption.oldest"),
                                    },
                                ],
                                defaultSelected:
                                    MusicSheet.getSheetMeta(id, "sort") ||
                                    SortType.None,
                                title: t("sheetDetail.sortMusic"),
                                async onOk(value) {
                                    await MusicSheet.setSortType(
                                        id,
                                        value as SortType,
                                    );
                                    toast.success(t("toast.sortHasBeenUpdated"));
                                },
                            });
                        },
                    },
                    {
                        icon: "trash-outline",
                        title: t("sheetDetail.deleteSheet"),
                        show: id !== "favorite",
                        onPress() {
                            showDialog("SimpleDialog", {
                                title: t("sheetDetail.deleteSheet"),
                                content: t("sheetDetail.deleteSheetContent", {
                                    name: musicSheet.title,
                                }),
                                onOk: async () => {
                                    await MusicSheet.removeSheet(id);
                                    Toast.success(t("toast.deleteSuccess"));
                                    navigation.goBack();
                                },
                            });
                        },
                    },
                ]}
                actions={[
                    {
                        icon: "magnifying-glass",
                        onPress() {
                            navigation.navigate(ROUTE_PATH.SEARCH_MUSIC_LIST, {
                                musicList: musicSheet?.musicList,
                                musicSheet: musicSheet,
                            });
                        },
                    },
                ]}>
                {t("common.sheet")}
            </AppBar>
        </>
    );
}
