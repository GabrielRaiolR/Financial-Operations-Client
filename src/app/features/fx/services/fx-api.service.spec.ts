import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { FxApiService } from './fx-api.service';
import { environment } from '../../../../environments/environment';

describe('FxApiService', () => {
  let service: FxApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FxApiService,
      ],
    });
    service = TestBed.inject(FxApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getRate() should GET /fx/rate with from and to', () => {
    service.getRate('USD', 'BRL').subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/fx/rate`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('from')).toBe('USD');
    expect(req.request.params.get('to')).toBe('BRL');
    req.flush({
      rate: 5.12,
      from: 'USD',
      to: 'BRL',
      asOf: '2026-01-01T12:00:00Z',
      source: 'test',
    });
  });
});
