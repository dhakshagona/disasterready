export type MapPlatform = 'ios' | 'android' | 'web';

export type MapDestination = {
  latitude: number;
  longitude: number;
  label: string;
};

export interface ExternalLinking {
  canOpenURL(url: string): Promise<boolean>;
  openURL(url: string): Promise<unknown>;
}

export type MapRoute = { preferredUrl: string; fallbackUrl: string };

function googleMapsWebUrl(destination: MapDestination): string {
  const query = new URLSearchParams({
    api: '1',
    destination: `${destination.latitude},${destination.longitude}`,
  });
  return `https://www.google.com/maps/dir/?${query.toString()}`;
}

export function buildMapRoute(platform: MapPlatform, destination: MapDestination): MapRoute {
  const coordinate = `${destination.latitude},${destination.longitude}`;
  if (platform === 'ios') {
    const query = new URLSearchParams({ daddr: coordinate, q: destination.label, dirflg: 'd' });
    return {
      preferredUrl: `maps://?${query.toString()}`,
      fallbackUrl: `https://maps.apple.com/?${query.toString()}`,
    };
  }
  if (platform === 'android') {
    return {
      preferredUrl: `google.navigation:q=${encodeURIComponent(coordinate)}`,
      fallbackUrl: googleMapsWebUrl(destination),
    };
  }
  const fallbackUrl = googleMapsWebUrl(destination);
  return { preferredUrl: fallbackUrl, fallbackUrl };
}

export class MapRoutingService {
  constructor(
    private readonly platform: MapPlatform,
    private readonly linking: ExternalLinking,
  ) {}

  async openDestination(destination: MapDestination): Promise<void> {
    const route = buildMapRoute(this.platform, destination);
    if (route.preferredUrl === route.fallbackUrl) {
      await this.linking.openURL(route.fallbackUrl);
      return;
    }
    try {
      if (await this.linking.canOpenURL(route.preferredUrl)) {
        await this.linking.openURL(route.preferredUrl);
        return;
      }
    } catch {
      // Fall through to the universal web URL when native scheme checks are unavailable.
    }
    await this.linking.openURL(route.fallbackUrl);
  }
}
