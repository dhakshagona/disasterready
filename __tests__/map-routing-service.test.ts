import { MapRoutingService, buildMapRoute, type ExternalLinking } from '@/application/routing/map-routing-service';
import { describe, expect, it } from '@jest/globals';

const destination = {
  latitude: 30.2672,
  longitude: -97.7431,
  label: 'Austin Convention Center',
};

describe('platform map routing', () => {
  it('uses Apple Maps on iOS', () => {
    const route = buildMapRoute('ios', destination);

    expect(route.preferredUrl).toContain('maps://');
    expect(route.fallbackUrl).toContain('maps.apple.com');
  });

  it('uses Google Maps navigation on Android', () => {
    const route = buildMapRoute('android', destination);

    expect(route.preferredUrl).toContain('google.navigation:');
    expect(route.fallbackUrl).toContain('google.com/maps/dir');
  });

  it('uses a browser-safe Google Maps URL on web', () => {
    const route = buildMapRoute('web', destination);

    expect(route.preferredUrl).toBe(route.fallbackUrl);
    expect(route.preferredUrl).toContain('https://www.google.com/maps/dir/');
    expect(route.preferredUrl).toContain('destination=30.2672%2C-97.7431');
    expect(route.preferredUrl).not.toContain('destination_place_id');
  });

  it('falls back to a web route when the preferred native map is unavailable', async () => {
    const opened: string[] = [];
    const linking: ExternalLinking = {
      canOpenURL: async () => false,
      openURL: async (url) => { opened.push(url); },
    };
    const service = new MapRoutingService('ios', linking);

    await service.openDestination(destination);

    expect(opened).toEqual([expect.stringContaining('maps.apple.com')]);
  });
});
