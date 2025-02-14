# Grid
Experimental Grid Element

## Usage
When creating simple grid layouts within content.  Not intended for creation of full page layouts.

## Simple Grid

Display all 12 columns
```html
<rhx-grid>
  <div>Grid Item 1</div>
  <div>Grid Item 2</div>
  <div>Grid Item 3</div>
  <div>Grid Item 4</div>
  <div>Grid Item 5</div>
  <div>Grid Item 6</div>
  <div>Grid Item 7</div>
  <div>Grid Item 8</div>
  <div>Grid Item 9</div>
  <div>Grid Item 10</div>
  <div>Grid Item 11</div>
  <div>Grid Item 12</div>
</rhx-grid>
```

Display 4 of 12, each element will auto span 3
```html
<rhx-grid>
  <div>Grid Item 1</div>
  <div>Grid Item 2</div>
  <div>Grid Item 3</div>
  <div>Grid Item 4</div>
</rhx-grid>
```

### Column breakpoints

One column row at 0 - 576px `2xs` 
Two columns row at (min-width: 576px) `xs` breakpoint
Four columns row at (min-width: 768px) `md` breakpoint

Visit the Red Hat Design System website for more information about [breakpoints](https://ux.redhat.com/tokens/breakpoint/).

```html
<rhx-grid columns="2xs:2 xs:3 md:4">
  <div>Grid Item 1</div>
  <div>Grid Item 2</div>
  <div>Grid Item 3</div>
  <div>Grid Item 4</div>
</rhx-grid>
```

## Advanced Grids

To create more complex grids with column and row spans.

`<rhx-grid-item>` enabled application of `col-span` and `row-span`

### Column Span

12 column grid with two items.  First spanning 4 columns, second spanning 8.

```html
<rhx-grid>
  <rhx-grid-item col-span="2xs:4">col-span="2xs:4"</rhx-grid-item>
  <rhx-grid-item col-span="2xs:8">col-span="2xs:8"</rhx-grid-item>
</rhx-grid>
```

### Row Span

12 column grid with four items.

At `2xs` breakpoint all items stacked taking up one row each.

At `xs` breakpoint first item spanning 6 columns and 3 rows, the remainder spanning 6 columns.

At `md` breakpoint first item spanning 8 columns and 3 rows, the remainder spanning 4 columns.

```html
<rhx-grid>
  <rhx-grid-item col-span="2xs:12 xs:6 md:8" row-span="2xs:1 xs:3">A</rhx-grid-item>
  <rhx-grid-item col-span="2xs:12 xs:6 md:4">B</rhx-grid-item>
  <rhx-grid-item col-span="2xs:12 xs:6 md:4">C</rhx-grid-item>
  <rhx-grid-item col-span="2xs:12 xs:6 md:4">D</rhx-grid-item>
</rhx-grid>
```