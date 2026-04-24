import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'generic-button',
  imports: [NgClass, RouterLink],
  templateUrl: './generic-button.html',
  styleUrl: './generic-button.css',
})
export class GenericButton {
  private resolvedColor: 'red' | 'green' | 'gray' = 'gray';

  @Input() link = '/';

  @Input()
  set color(value: string | undefined) {
    const normalized = (value || '').toLowerCase();

    if (normalized === 'red' || normalized === 'green' || normalized === 'gray') {
      this.resolvedColor = normalized;
      return;
    }

    this.resolvedColor = 'gray';
  }

  get colorClass(): 'red' | 'green' | 'gray' {
    return this.resolvedColor;
  }
}
