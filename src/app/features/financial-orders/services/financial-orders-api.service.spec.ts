import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { FinancialOrdersApiService } from './financial-orders-api.service';
import { environment } from '../../../../environments/environment';

describe('FinancialOrdersApiService', () => {
  let service: FinancialOrdersApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FinancialOrdersApiService,
      ],
    });
    service = TestBed.inject(FinancialOrdersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() should GET with pagination and optional status', () => {
    service.list(1, 15, 'PENDING').subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/financial-orders`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('15');
    expect(req.request.params.get('status')).toBe('PENDING');
    req.flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 15,
      number: 1,
      first: false,
      last: true,
    });
  });

  it('getById() should GET /financial-orders/:id', () => {
    service.getById('ord-1').subscribe();
    const req = httpMock.expectOne(
      `${environment.apiUrl}/financial-orders/ord-1`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({} as any);
  });

  it('create() should POST CreateFinancialOrderRequest', () => {
    const payload = {
      type: 'PAYABLE' as const,
      amount: 100.5,
      description: 'Test order',
    };
    service.create(payload).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/financial-orders`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({} as any);
  });

  it('approve() should POST empty body to .../approve', () => {
    service.approve('ord-1').subscribe();
    const req = httpMock.expectOne(
      `${environment.apiUrl}/financial-orders/ord-1/approve`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({} as any);
  });

  it('reject() should POST body with optional reason', () => {
    service.reject('ord-1', 'reason text').subscribe();
    const req = httpMock.expectOne(
      `${environment.apiUrl}/financial-orders/ord-1/reject`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'reason text' });
    req.flush({} as any);
  });
});
