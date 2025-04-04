import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Product } from '../../../types';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService } from 'primeng/api';
import { PricePipe } from '../../pipes/price.pipe';
import { TruncateNamePipe } from '../../pipes/truncate-name.pipe';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    RatingModule,
    FormsModule,
    ButtonModule,
    ConfirmPopupModule,
    ToastModule,
    PricePipe,
    TruncateNamePipe,
  ],
  providers: [ConfirmationService],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
})
export class ProductComponent {
  // The constructor constructor(private confirmationService: ConfirmationService) {} is used to inject an instance of the ConfirmationService into the ProductComponent.
  //ConfirmationService is a service provided by PrimeNG.It is used to display confirmation dialogs. By injecting ConfirmationService into ProductComponent, the component gains access to methods and functionality provided by ConfirmationService.
  constructor(private confirmationService: ConfirmationService) {}

  //The @ViewChild decorator in Angular is used to get a reference to a child component, directive, or DOM element within the template of the current component.

  //In this case, @ViewChild('deleteButton') deleteButton: any; is used to get a reference to a DOM element with the template variable name deleteButton.
  @ViewChild('deleteButton') deleteButton: any;

  @Input() product!: Product; //product is an input property that accepts a Product object from the parent component.
  @Output() edit: EventEmitter<Product> = new EventEmitter<Product>(); //edit is an output property that emits a Product object when the editProduct() method is called.
  @Output() delete: EventEmitter<Product> = new EventEmitter<Product>(); //output property that emits a Product object when the confirmDelete() method is called and the delete action is confirmed.

  editProduct() {
    this.edit.emit(this.product);
  }

  confirmDelete() {
    this.confirmationService.confirm({
      target: this.deleteButton.nativeElement,
      message: 'Are you sure that you want to delete this product?',
      accept: () => {
        this.deleteProduct();
      },
    });
  }

  deleteProduct() {
    this.delete.emit(this.product);
  }

  ngOnInit() {}
}
