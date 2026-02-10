import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SalesService } from './sales.service';
import { Sale, PaymentMethod, SaleStatus } from './entities/sale.entity';
import { Client } from '../clients/entities/client.entity';
import { ProductsService } from './products.service';
import { AuditService } from '../audit/audit.service';
import { Product } from './entities/product.entity';
import { ProductStock } from './entities/product-stock.entity';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
} from '../packages/entities/transaction.entity';
import { SaleItem } from './entities/sale-item.entity';

describe('SalesService', () => {
  let service: SalesService;
  let dataSource: jest.Mocked<DataSource>;
  let entityManagerMock: any;

  const mockClient = {
    id: 'client-123',
    tenantId: 'tenant-123',
    creditBalance: 1000,
  } as Client;

  const mockProduct = {
    id: 'prod-123',
    name: 'Protein Shake',
    price: 5.0,
    tenantId: 'tenant-123',
  } as Product;

  const mockStock = {
    id: 'stock-123',
    productId: 'prod-123',
    studioId: 'studio-123',
    quantity: 10,
  } as ProductStock;

  beforeEach(async () => {
    entityManagerMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getRepositoryToken(Sale),
          useValue: {
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {},
        },
        {
          provide: ProductsService,
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest
              .fn()
              .mockImplementation(async (cb) => cb(entityManagerMock)),
            getRepository: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    dataSource = module.get(DataSource);
  });

  describe('createSale', () => {
    const saleDto = {
      clientId: 'client-123',
      studioId: 'studio-123',
      items: [{ productId: 'prod-123', quantity: 2 }],
      paymentMethod: PaymentMethod.ON_ACCOUNT,
    };

    it('should deduct from client balance for On-Account payments', async () => {
      // Mock EntityManager lookups
      entityManagerMock.findOne
        .mockResolvedValueOnce(mockClient) // Client lookup
        .mockResolvedValueOnce(mockProduct) // Product lookup
        .mockResolvedValueOnce(mockStock); // Stock lookup

      // Mock creations
      entityManagerMock.create.mockImplementation((entityClass, data) => data);

      await service.createSale('tenant-123', 'user-123', saleDto);

      // Verify client balance update
      expect(entityManagerMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'client-123',
          creditBalance: 990, // 1000 - (5.0 * 2)
        }),
      );

      // Verify transaction creation
      expect(entityManagerMock.create).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({
          clientId: 'client-123',
          type: TransactionType.EXPENSE,
          amount: -10,
          category: TransactionCategory.RETAIL_SALE,
        }),
      );
    });

    it('should create income transaction for Cash payments', async () => {
      const cashDto = { ...saleDto, paymentMethod: PaymentMethod.CASH };

      // Mock EntityManager lookups
      entityManagerMock.findOne
        .mockResolvedValueOnce(mockClient) // Client lookup
        .mockResolvedValueOnce(mockProduct) // Product lookup
        .mockResolvedValueOnce(mockStock); // Stock lookup

      entityManagerMock.create.mockImplementation((entityClass, data) => data);

      await service.createSale('tenant-123', 'user-123', cashDto);

      // Verify transaction creation
      expect(entityManagerMock.create).toHaveBeenCalledWith(
        Transaction,
        expect.objectContaining({
          type: TransactionType.INCOME,
          amount: 10,
          category: TransactionCategory.RETAIL_SALE,
        }),
      );
    });
  });
});
