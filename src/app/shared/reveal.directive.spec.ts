import { Component, PLATFORM_ID, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RevealDirective } from './reveal.directive';

@Component({
  standalone: true,
  imports: [RevealDirective],
  template: `<div appReveal data-testid="target"></div>`,
})
class HostComponent {}

@Component({
  standalone: true,
  imports: [RevealDirective],
  template: `<div appReveal [revealStagger]="100" data-testid="parent">
    <span class="c">a</span><span class="c">b</span>
  </div>`,
})
class StaggerHostComponent {}

describe('RevealDirective', () => {
  let observeSpy: ReturnType<typeof vi.fn>;
  let disconnectSpy: ReturnType<typeof vi.fn>;
  let intersectionCallback: IntersectionObserverCallback;

  beforeEach(() => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();

    class MockIntersectionObserver {
      constructor(cb: IntersectionObserverCallback) {
        intersectionCallback = cb;
      }
      observe = observeSpy;
      disconnect = disconnectSpy;
      unobserve = vi.fn();
      takeRecords = () => [];
      root = null;
      rootMargin = '';
      thresholds = [];
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function setup(providers: Provider[] = []) {
    TestBed.configureTestingModule({ imports: [HostComponent], providers });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges(); // triggers ngAfterViewInit
    const el = fixture.nativeElement.querySelector(
      '[data-testid="target"]',
    ) as HTMLElement;
    return { fixture, el };
  }

  it('starts hidden and observes the element on the client', () => {
    const { el } = setup();
    expect(el.classList.contains('reveal')).toBe(true);
    expect(observeSpy).toHaveBeenCalledWith(el);
    expect(el.classList.contains('is-revealed')).toBe(false);
  });

  it('reveals once and disconnects when the element intersects', () => {
    const { el } = setup();
    intersectionCallback(
      [{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(el.classList.contains('is-revealed')).toBe(true);
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it('stays hidden while the element is out of view', () => {
    const { el } = setup();
    intersectionCallback(
      [{ isIntersecting: false, target: el } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(el.classList.contains('is-revealed')).toBe(false);
    expect(disconnectSpy).not.toHaveBeenCalled();
  });

  it('staggers direct children (not the host) when revealStagger is set', () => {
    TestBed.configureTestingModule({ imports: [StaggerHostComponent] });
    const fixture = TestBed.createComponent(StaggerHostComponent);
    fixture.detectChanges();
    const parent = fixture.nativeElement.querySelector(
      '[data-testid="parent"]',
    ) as HTMLElement;
    const children = Array.from(
      parent.querySelectorAll<HTMLElement>('.c'),
    );

    expect(parent.classList.contains('reveal')).toBe(false);
    expect(children[0].classList.contains('reveal')).toBe(true);
    expect(children[1].classList.contains('reveal')).toBe(true);
    expect(children[0].style.getPropertyValue('--reveal-delay')).toBe('0ms');
    expect(children[1].style.getPropertyValue('--reveal-delay')).toBe('100ms');
    expect(observeSpy).toHaveBeenCalledWith(parent);

    intersectionCallback(
      [{ isIntersecting: true, target: parent } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(children[0].classList.contains('is-revealed')).toBe(true);
    expect(children[1].classList.contains('is-revealed')).toBe(true);
  });

  it('does nothing on the server (no observer, content stays visible)', () => {
    const { el } = setup([{ provide: PLATFORM_ID, useValue: 'server' }]);
    expect(el.classList.contains('reveal')).toBe(false);
    expect(observeSpy).not.toHaveBeenCalled();
  });
});
