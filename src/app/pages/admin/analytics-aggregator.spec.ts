import { excludeVisitors } from './analytics-aggregator';
import { PortfolioEvent } from '../../services/analytics.service';

function ev(visitor_id: string): PortfolioEvent {
  return { visitor_id, event_type: 'page_view' };
}

describe('excludeVisitors', () => {
  it('removes every event from an excluded visitor id', () => {
    const events = [ev('a'), ev('b'), ev('a'), ev('c')];
    const result = excludeVisitors(events, new Set(['a']));
    expect(result).toHaveLength(2);
    expect(result.some(e => e.visitor_id === 'a')).toBe(false);
  });

  it('excludes multiple ids', () => {
    const events = [ev('a'), ev('b'), ev('c')];
    expect(excludeVisitors(events, new Set(['a', 'c']))).toEqual([ev('b')]);
  });

  it('returns the same array unchanged when the exclusion set is empty', () => {
    const events = [ev('a'), ev('b')];
    expect(excludeVisitors(events, new Set())).toBe(events);
  });
});
