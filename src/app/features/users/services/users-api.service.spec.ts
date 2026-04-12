import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UsersApiService } from './users-api.service';
import { environment } from '../../../../environments/environment';

describe('UsersApiService', () => {
  let service: UsersApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UsersApiService,
      ],
    });
    service = TestBed.inject(UsersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() should GET /users with pagination', () => {
    service.list(0, 10).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/users`,
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    req.flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    });
  });

  it('getById() should GET /users/:id', () => {
    service.getById('550e8400-e29b-41d4-a716-446655440000').subscribe();
    const req = httpMock.expectOne(
      `${environment.apiUrl}/users/550e8400-e29b-41d4-a716-446655440000`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({} as any);
  });

  it('create() should POST /users', () => {
    const payload = {
      email: 'a@b.com',
      password: '12345678',
      role: 'FINANCE' as const,
    };
    service.create(payload).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({} as any);
  });

  it('delete() should DELETE /users/:id', () => {
    service.delete('user-123').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/users/user-123`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('patch() should PATCH /users/:id with body', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const body = { email: 'new@company.com' };
    service.patch(id, body).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/users/${id}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    req.flush({} as any);
  });
});
