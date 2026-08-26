package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.graphics.Color

private val DarkColorScheme =
  darkColorScheme(
    primary = NeonLavenderAccent,
    onPrimary = ObsidianBlack,
    primaryContainer = DarkPurpleAccent,
    onPrimaryContainer = LightPastelLavender,
    secondary = NeonLavenderAccent,
    onSecondary = ObsidianBlack,
    background = ObsidianBlack,
    onBackground = Color.White,
    surface = DeepCharcoal,
    onSurface = Color.White,
    surfaceVariant = DeepCharcoal,
    onSurfaceVariant = Color.White
  )

private val LightColorScheme =
  lightColorScheme(
    primary = DarkPurpleAccent,
    onPrimary = Color.White,
    primaryContainer = LightPastelLavender,
    onPrimaryContainer = ObsidianBlack,
    secondary = NeonLavenderAccent,
    onSecondary = ObsidianBlack,
    background = ObsidianBlack,
    onBackground = Color.White,
    surface = DeepCharcoal,
    onSurface = Color.White,
    surfaceVariant = DeepCharcoal,
    onSurfaceVariant = Color.White
  )

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = true, // Force the sleek Clean Minimalism theme
  dynamicColor: Boolean = false, // Use our gorgeous custom palette
  content: @Composable () -> Unit,
) {
  val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
