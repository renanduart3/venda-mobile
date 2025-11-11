import React from 'react';
import { View, Text } from 'react-native';

type Item = { label: string; value: number; color?: string };

export default function BarChart({
  data,
  orientation = 'vertical',
  maxBars = 12,
  height = 140,
  barColor = '#4f46e5',
  backgroundColor = '#e5e7eb',
}: {
  data: Item[];
  orientation?: 'vertical' | 'horizontal';
  maxBars?: number;
  height?: number;
  barColor?: string;
  backgroundColor?: string;
}) {
  const items = Array.isArray(data) ? data.slice(0, maxBars) : [];
  const max = Math.max(1, ...items.map(i => i.value || 0));

  if (orientation === 'horizontal') {
    return (
      <View style={{ gap: 8 }}>
        {items.map((it, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ width: 140 }} numberOfLines={1}>
              {it.label}
            </Text>
            <View style={{ flex: 1, height: 12, backgroundColor, borderRadius: 6, overflow: 'hidden' }}>
              <View
                style={{
                  width: `${(Math.max(0, it.value) / max) * 100}%`,
                  height: '100%',
                  backgroundColor: it.color || barColor,
                }}
              />
            </View>
            <Text style={{ width: 60, textAlign: 'right' }}>{formatNumber(it.value)}</Text>
          </View>
        ))}
      </View>
    );
  }

  // vertical
  // Dynamic width logic: if too many bars, allow horizontal scroll instead of squishing or overflowing container
  const maxVisibleBars = 10; // threshold before enabling scroll
  const baseBarWidth = 28;
  const gap = 8;
  const shouldScroll = orientation === 'vertical' && items.length > maxVisibleBars;
  const barWidth = shouldScroll ? baseBarWidth : Math.max(10, Math.min(baseBarWidth, Math.floor(280 / Math.max(items.length, 1))));
  const contentWidth = shouldScroll ? (items.length * (barWidth + gap)) + 16 : undefined;
  return (
    <View style={{ height, justifyContent: 'flex-end', width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: height - 20, gap, width: contentWidth }}>
        {items.map((it, idx) => (
          <View key={idx} style={{ alignItems: 'center' }}>
            <View
              style={{
                width: barWidth,
                height: Math.max(2, Math.round((Math.max(0, it.value) / max) * (height - 36))),
                backgroundColor: it.color || barColor,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
              }}
            />
            <Text style={{ width: barWidth + 8, fontSize: 10, textAlign: 'center' }} numberOfLines={1}>
              {it.label}
            </Text>
          </View>
        ))}
      </View>
      {shouldScroll && (
        <Text style={{ marginTop: 4, fontSize: 10, color: '#6b7280', textAlign: 'center' }}>Deslize horizontalmente para ver todas as barras</Text>
      )}
    </View>
  );
}

function formatNumber(n: number) {
  try {
    return Number(n || 0).toLocaleString('pt-BR');
  } catch {
    return String(n);
  }
}
