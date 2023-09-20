'use strict';

var ScrollViewViewConfig = {
  uiViewClassName: 'RCTScrollView',
  bubblingEventTypes: {},
  directEventTypes: {
    topScrollToTop: {
      registrationName: 'onScrollToTop'
    }
  },
  validAttributes: {
    alwaysBounceHorizontal: true,
    alwaysBounceVertical: true,
    automaticallyAdjustContentInsets: true,
    automaticallyAdjustKeyboardInsets: true,
    automaticallyAdjustsScrollIndicatorInsets: true,
    bounces: true,
    bouncesZoom: true,
    canCancelContentTouches: true,
    centerContent: true,
    contentInset: {
      diff: require("../../Utilities/differ/pointsDiffer")
    },
    contentOffset: {
      diff: require("../../Utilities/differ/pointsDiffer")
    },
    contentInsetAdjustmentBehavior: true,
    decelerationRate: true,
    directionalLockEnabled: true,
    disableIntervalMomentum: true,
    endFillColor: {
      process: require("../../StyleSheet/processColor").default
    },
    fadingEdgeLength: true,
    indicatorStyle: true,
    inverted: true,
    isInvertedVirtualizedList: true,
    keyboardDismissMode: true,
    maintainVisibleContentPosition: true,
    maximumZoomScale: true,
    minimumZoomScale: true,
    nestedScrollEnabled: true,
    onMomentumScrollBegin: true,
    onMomentumScrollEnd: true,
    onScroll: true,
    onScrollBeginDrag: true,
    onScrollEndDrag: true,
    onScrollToTop: true,
    overScrollMode: true,
    pagingEnabled: true,
    persistentScrollbar: true,
    pinchGestureEnabled: true,
    scrollEnabled: true,
    scrollEventThrottle: true,
    scrollIndicatorInsets: {
      diff: require("../../Utilities/differ/pointsDiffer")
    },
    scrollPerfTag: true,
    scrollToOverflowEnabled: true,
    scrollsToTop: true,
    sendMomentumEvents: true,
    showsHorizontalScrollIndicator: true,
    showsVerticalScrollIndicator: true,
    snapToAlignment: true,
    snapToEnd: true,
    snapToInterval: true,
    snapToOffsets: true,
    snapToStart: true,
    zoomScale: true
  }
};
module.exports = ScrollViewViewConfig;
//# sourceMappingURL=ScrollViewViewConfig.js.map