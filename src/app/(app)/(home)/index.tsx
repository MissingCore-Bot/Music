import { FlashList } from "@shopify/flash-list";
import { Link } from "expo-router";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NativeScrollEvent } from "react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import {
  useFavoriteListsForMediaCard,
  useFavoriteTracksCount,
} from "@/api/favorites";
import { useGetColumn } from "@/hooks/layout";
import { recentlyPlayedDataAtom } from "@/features/playback/api/recent";

import { abbreviateNum } from "@/utils/number";
import { MediaCard, PlaceholderContent } from "@/components/media/MediaCard";
import { SpecialPlaylists } from "@/features/playback/constants";

/** @description Detect if we're near the end of a `<ScrollView />`. */
const isCloseToBottom = ({
  layoutMeasurement,
  contentOffset,
  contentSize,
}: NativeScrollEvent) => {
  const paddingToBottom = 16;
  return (
    layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom
  );
};

/** @description Screen for `/` route. */
export default function HomeScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [endOfScrollView, setEndOfScrollView] = useState(false);

  /**
   * @description Fix scroll position if we're at the end of the `<ScrollView />`
   *  and we removed all items at the end.
   */
  const adjustScrollPosition = useCallback(() => {
    if (endOfScrollView) scrollViewRef.current?.scrollToEnd();
  }, [endOfScrollView]);

  const { width: colWidthSmall } = useGetColumn({
    ...{ cols: 1, gap: 16, gutters: 32, minWidth: 100 },
  });

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pt-[22px]"
      onMomentumScrollEnd={({ nativeEvent }) => {
        setEndOfScrollView(isCloseToBottom(nativeEvent));
      }}
    >
      <Text className="mb-4 px-4 font-geistMonoMedium text-subtitle text-foreground50">
        RECENTLY PLAYED
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        contentContainerClassName="gap-4 px-4"
      >
        <RecentlyPlayed colWidth={colWidthSmall} />
      </ScrollView>

      <FavoriteListSection fixScrollPosition={adjustScrollPosition} />
    </ScrollView>
  );
}

/** @description An array of `<MediaCards />` of recently played media. */
function RecentlyPlayed({ colWidth }: { colWidth: number }) {
  const recentlyPlayedData = useAtomValue(recentlyPlayedDataAtom);

  if (recentlyPlayedData.length === 0) {
    return (
      <Text className="my-4 font-geistMono text-base text-foreground100">
        You haven't played anything yet!
      </Text>
    );
  }

  return recentlyPlayedData.map((props) => (
    <MediaCard key={props.href} {...props} size={colWidth} />
  ));
}

/**
 * @description Lists out albums or playlists we've favorited, and a
 *  special playlist containing all our favorited tracks.
 */
function FavoriteListSection({
  fixScrollPosition,
}: {
  fixScrollPosition: () => void;
}) {
  const { data } = useFavoriteListsForMediaCard();

  const { width, count } = useGetColumn({
    ...{ cols: 2, gap: 16, gutters: 32, minWidth: 175 },
  });

  useEffect(() => {
    fixScrollPosition();
  }, [fixScrollPosition, data]);

  return (
    <View className="px-4">
      <Text className="mb-4 mt-8 font-geistMonoMedium text-subtitle text-foreground50">
        FAVORITES
      </Text>
      <View className="-m-2 mt-0 flex-1">
        <FlashList
          numColumns={count}
          estimatedItemSize={width + 37} // 35px `<TextStack />` Height + 2px Margin Top
          data={data ? [PlaceholderContent, ...data] : [PlaceholderContent]}
          keyExtractor={({ href }) => href}
          renderItem={({ item: data, index }) => (
            <View className="mx-2 mb-4">
              {index === 0 ? (
                <FavoriteTracks colWidth={width} />
              ) : (
                <MediaCard {...data} size={width} />
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

/**
 * @description A button displaying the number of favorite tracks & takes
 *  the user to a special "Favorite Tracks" playlist.
 */
function FavoriteTracks({ colWidth }: { colWidth: number }) {
  const { isPending, error, data } = useFavoriteTracksCount();

  const trackCount = isPending || error ? "" : abbreviateNum(data);

  return (
    <Link href={`/playlist/${SpecialPlaylists.favorites}`} asChild>
      <Pressable
        style={{ width: colWidth, height: colWidth }}
        className="items-center justify-center rounded-lg bg-accent500 active:opacity-75"
      >
        <Text className="text-center font-ndot57 text-title text-foreground50">
          {trackCount}
          {"\nTracks"}
        </Text>
      </Pressable>
    </Link>
  );
}
