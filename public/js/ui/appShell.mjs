import React from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';

const e = React.createElement;

function AppShell() {
  return e(
    React.Fragment,
    null,
    e('div', { id: 'map' }),
    e('div', { className: 'map-glow' }),

    e(
      'aside',
      { className: 'card shade-card' },
      e(
        'div',
        { className: 'card-head' },
        e('h2', null, 'Live Shadow Engine'),
        e('span', { id: 'loader', className: 'pill' }, 'Idle')
      ),
      e(
        'div',
        { className: 'time-line' },
        e('button', { id: 'decrement', type: 'button', 'aria-label': 'Minus one hour' }, '-1h'),
        e('button', { id: 'increment', type: 'button', 'aria-label': 'Plus one hour' }, '+1h'),
        e('button', { id: 'play', type: 'button' }, 'Play'),
        e('button', { id: 'stop', type: 'button' }, 'Stop')
      ),
      e(
        'label',
        { className: 'toggle' },
        e('input', { id: 'exposure', type: 'checkbox', autoComplete: 'off' }),
        e('span', null, 'Full-day sun exposure')
      ),
      e(
        'div',
        { className: 'meta-row' },
        'Time ',
        e('strong', { id: 'currentTime' }, '-')
      ),
      e(
        'div',
        { id: 'exposureGradientContainer', className: 'gradient-wrap hidden' },
        e(
          'div',
          { className: 'meta-row' },
          'Sunlight at cursor ',
          e('strong', { id: 'hours' }, '-'),
          ' h'
        ),
        e('div', { id: 'exposureGradient', className: 'gradient' })
      )
    ),

    e(
      'aside',
      { className: 'card route-card' },
      e(
        'header',
        { className: 'card-head stack' },
        e('h1', null, 'Cool Routes UAE'),
        e('p', null, 'Finds shaded walking paths and dispatches a pod when direct-sun stretch is too long.')
      ),
      e(
        'form',
        { id: 'routeForm', className: 'route-form' },
        e(
          'div',
          { className: 'input-block' },
          e('label', { htmlFor: 'fromInput' }, 'Start (A)'),
          e(
            'div',
            { className: 'inline-input' },
            e('input', {
              id: 'fromInput',
              name: 'from',
              type: 'text',
              placeholder: 'Dubai Mall',
              required: true
            }),
            e('button', { id: 'pickFromBtn', type: 'button', className: 'ghost' }, 'Pick')
          )
        ),
        e(
          'div',
          { className: 'input-block' },
          e('label', { htmlFor: 'toInput' }, 'Destination (B)'),
          e(
            'div',
            { className: 'inline-input' },
            e('input', {
              id: 'toInput',
              name: 'to',
              type: 'text',
              placeholder: 'Burj Khalifa',
              required: true
            }),
            e('button', { id: 'pickToBtn', type: 'button', className: 'ghost' }, 'Pick')
          )
        ),
        e(
          'div',
          { className: 'row-between' },
          e(
            'label',
            { className: 'toggle compact' },
            e('input', { id: 'autoPod', type: 'checkbox', defaultChecked: true }),
            e('span', null, 'Auto pod dispatch')
          ),
          e(
            'div',
            { className: 'inline-tools' },
            e('button', { id: 'swapBtn', type: 'button', className: 'ghost' }, 'Swap'),
            e('button', { id: 'clearBtn', type: 'button', className: 'ghost' }, 'Clear')
          )
        ),
        e('button', { id: 'planBtn', type: 'submit', className: 'primary' }, 'Build Cool Route')
      ),
      e('div', { id: 'pickHint', className: 'hint hidden' }, 'Tap the map to set location.'),
      e('div', { id: 'status', className: 'status' }, 'Loading runtime config...'),

      e(
        'section',
        { className: 'stats-grid' },
        e('article', { className: 'metric' }, e('span', null, 'Distance'), e('strong', { id: 'distanceValue' }, '-')),
        e('article', { className: 'metric' }, e('span', null, 'ETA'), e('strong', { id: 'durationValue' }, '-')),
        e('article', { className: 'metric' }, e('span', null, 'Shade'), e('strong', { id: 'shadeValue' }, '-')),
        e('article', { className: 'metric' }, e('span', null, 'Sunny'), e('strong', { id: 'sunnyValue' }, '-'))
      ),

      e('section', null, e('h3', null, 'Coordination Agent'), e('div', { id: 'podStatus', className: 'box' }, 'No active pod dispatch.')),

      e('section', null, e('h3', null, 'Route Candidates'), e('div', { id: 'alternatives', className: 'box' }, 'No computed routes yet.'))
    )
  );
}

export function mountAppShell(container) {
  const root = createRoot(container);
  root.render(e(AppShell));
  return root;
}
