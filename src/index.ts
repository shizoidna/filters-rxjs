import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { map, pluck, throwIfEmpty } from 'rxjs/operators';

import { data } from './entities/data';
import { FilterState } from './entities/filter-state';
import { Sofa } from './entities/sofa';

// =================== CONSTANCE =====================

const selectorsMap: { [filterName: string]: string } = {
  'select-style': 'style',
  'select-material': 'material',
  'select-color': 'color',
  'select-origin': 'origin',
};

const resetSelectorsMap: { [filterName: string]: string } = {
  'btn-reset-style': 'style',
  'btn-reset-material': 'material',
  'btn-reset-color': 'color',
  'btn-reset-origin': 'origin',
};

// =================== STATE =====================

const initialState: FilterState = {
  style: '',
  material: '',
  color: '',
  origin: '',
};

const stateSubject: BehaviorSubject<FilterState> = new BehaviorSubject<FilterState>(initialState);

// =================== SOURCES =====================

const selectsIds: string[] = Object.keys(selectorsMap);
const selectsEventStreams: Array<Observable<Partial<FilterState>>> = selectsIds.map((id: string) =>
  makeEventStreamById(id, selectorsMap[id]));

const resetIds: string[] = Object.keys(resetSelectorsMap);
const resetEventStreams: Array<Observable<Partial<FilterState>>> = resetIds.map((id: string) => {
  const filterName: string = resetSelectorsMap[id];
  const filterValue: string = initialState[filterName as keyof typeof initialState];
  const filteredInitialState: Partial<FilterState> = {[filterName]: filterValue};

  return makeResetEventStream(id, filteredInitialState);
});

const filterEvents$: Observable<Partial<FilterState>> = merge(
  ...selectsEventStreams,
  ...resetEventStreams,
  makeResetEventStream('btn-reset-all', initialState),
);

// =================== HELPERS =====================

function renderListItem(item: Sofa, list: HTMLElement): void {
  const li: HTMLElement = document.createElement('li');

  li.innerHTML = `Name: ${item.name},<br>style: ${item.style},<br>material: ${item.material},<br>color: ${item.color},
        <br>origin: ${item.origin}.`;
  list.appendChild(li);
}

function renderList(amountItems: Sofa[]): void {
  const list: HTMLElement | null = document.getElementById('list');

  if (list !== null) {
    amountItems.forEach((item: Sofa) => renderListItem(item, list));
  } else {
    throw new Error('Chosen element with such id does not exist');
  }
  console.log('rendered');
}

function clearList(list: HTMLElement | null): void {
  if (list !== null) {
    list.innerHTML = '';
  } else {
    throw new Error('Chosen element with such id does not exist');
  }
}

function filterStyle(sofaData: Sofa[], state: FilterState): Sofa[] {
  const list: HTMLElement | null = document.getElementById('list');
  clearList(list);
  const result: Sofa[] = sofaData
    .filter((element: Sofa) => state.style === element.style || state.style === '');
  renderList(result);

  return result;
}

function filterMaterial(sofaData: Sofa[], state: FilterState): Sofa[] {
  const list: HTMLElement | null = document.getElementById('list');
  clearList(list);
  const result: Sofa[] = sofaData
    .filter((element: Sofa) => state.material === element.material || state.material === '');
  renderList(result);

  return result;
}

function filterColor(sofaData: Sofa[], state: FilterState): Sofa[] {
  const list: HTMLElement | null = document.getElementById('list');
  clearList(list);
  const result: Sofa[] = sofaData
    .filter((element: Sofa) => state.color === element.color || state.color === '');
  renderList(result);

  return result;
}

function filterOrigin(sofaData: Sofa[], state: FilterState): Sofa[] {
  const list: HTMLElement | null = document.getElementById('list');
  clearList(list);
  const result: Sofa[] = sofaData
    .filter((element: Sofa) => state.origin === element.origin || state.origin === '');
  renderList(result);

  return result;
}

function selectElement(id: string, valueToSelect: string): void {
  const element: HTMLSelectElement | null = document.getElementById(id) as HTMLSelectElement;
}

function makeResetEventStream(id: string, state: Partial<FilterState>): Observable<Partial<FilterState>> {
  const element: HTMLElement | null = document.getElementById(id);

  if (element === null) {
    throw new Error(`Chosen element doesn't exist.`);
  }

  return fromEvent(element, 'click')
    .pipe(
      map((value: Event) => state),
    );
}

function makeEventStreamById(id: string, filterName: string): Observable<Partial<FilterState>> {
  const element: HTMLElement | null = document.getElementById(id);

  if (element === null) {
    throw new Error(`Element with id '${id}' doesn't exist.`);
  }

  return fromEvent(element, 'change')
    .pipe(
      pluck<Event, HTMLElement>('target'),
      pluck<HTMLElement, string>('value'),
      map((value: string) => ({[filterName]: value})),
    );
}

// =================== SUBSCRIPTION =====================

filterEvents$
  .subscribe((event: Partial<FilterState>) => {
    const previousState: FilterState = stateSubject.getValue();
    const modifiedState: FilterState = {...previousState, ...event};
    stateSubject.next(modifiedState);
    renderList([]);
  });

const makeStreamWithColor$: Observable<string> = stateSubject
  .pipe(
    map((state: FilterState) => state.color),
  );

const makeStreamWithOrigin$: Observable<string> = stateSubject
  .pipe(
    map(({origin}: FilterState) => origin),
  );

const makeStreamWithMaterial$: Observable<string> = stateSubject
  .pipe(
    pluck<FilterState, string>('material'),
  );

const makeStreamWithStyle$: Observable<string> = stateSubject
  .pipe(
    pluck<FilterState, string>('style'),
  );

makeStreamWithColor$
  .subscribe((value: string) => {
    selectElement('select-color', value);
  });

makeStreamWithOrigin$
  .subscribe((value: string) => {
    selectElement('select-origin', value);
  });

makeStreamWithStyle$
  .subscribe((value: string) => {
    selectElement('select-style', value);
  });

makeStreamWithMaterial$
  .subscribe((value: string) => {
    selectElement('select-material', value);
  });

stateSubject
  .subscribe((state: FilterState) => {
    console.log('filter has changed');
    const styleFilter: Sofa[] = filterStyle(data, state);
    const materialFilter: Sofa[] = filterMaterial(styleFilter, state);
    const colorFilter: Sofa[] = filterColor(materialFilter, state);
    filterOrigin(colorFilter, state);
  });
