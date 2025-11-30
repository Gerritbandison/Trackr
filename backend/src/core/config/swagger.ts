import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Trackr ITAM API',
            version: '1.0.0',
            description: 'IT Asset Management Platform API Documentation',
            contact: {
                name: 'API Support',
                email: 'support@trackr.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Development server'
            },
            {
                url: 'https://api.trackr.com/api/v1',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token obtained from /auth/login'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Error message'
                        },
                        error: {
                            type: 'string'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        email: {
                            type: 'string',
                            example: 'user@company.com'
                        },
                        name: {
                            type: 'string',
                            example: 'John Doe'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'manager', 'staff'],
                            example: 'staff'
                        },
                        department: {
                            type: 'string',
                            example: 'IT'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        lastLogin: {
                            type: 'string',
                            format: 'date-time'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                License: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string'
                        },
                        name: {
                            type: 'string',
                            example: 'Microsoft 365 E3'
                        },
                        vendor: {
                            type: 'string',
                            example: 'Microsoft'
                        },
                        type: {
                            type: 'string',
                            enum: ['perpetual', 'subscription', 'trial'],
                            example: 'subscription'
                        },
                        category: {
                            type: 'string',
                            example: 'Productivity'
                        },
                        totalSeats: {
                            type: 'number',
                            example: 100
                        },
                        usedSeats: {
                            type: 'number',
                            example: 85
                        },
                        availableSeats: {
                            type: 'number',
                            example: 15
                        },
                        purchaseDate: {
                            type: 'string',
                            format: 'date'
                        },
                        expirationDate: {
                            type: 'string',
                            format: 'date'
                        },
                        purchaseCost: {
                            type: 'number',
                            example: 10000
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'expiring', 'expired', 'cancelled'],
                            example: 'active'
                        },
                        complianceStatus: {
                            type: 'string',
                            enum: ['compliant', 'at-risk', 'non-compliant'],
                            example: 'at-risk'
                        }
                    }
                },
                Asset: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string'
                        },
                        assetTag: {
                            type: 'string',
                            example: 'LAP-001'
                        },
                        name: {
                            type: 'string',
                            example: 'MacBook Pro 14"'
                        },
                        category: {
                            type: 'string',
                            example: 'Laptop'
                        },
                        status: {
                            type: 'string',
                            enum: ['available', 'in-use', 'maintenance', 'retired'],
                            example: 'in-use'
                        },
                        purchasePrice: {
                            type: 'number',
                            example: 2500
                        },
                        purchaseDate: {
                            type: 'string',
                            format: 'date'
                        },
                        assignedTo: {
                            type: 'string'
                        }
                    }
                },
                Department: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string'
                        },
                        name: {
                            type: 'string',
                            example: 'Engineering'
                        },
                        description: {
                            type: 'string',
                            example: 'Software development team'
                        },
                        manager: {
                            type: 'string',
                            description: 'User ID of department manager'
                        },
                        costCenter: {
                            type: 'string',
                            example: 'CC-ENG-001'
                        },
                        budget: {
                            type: 'number',
                            example: 500000
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        }
                    }
                },
                Vendor: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string'
                        },
                        name: {
                            type: 'string',
                            example: 'Dell Technologies'
                        },
                        contactName: {
                            type: 'string',
                            example: 'Jane Smith'
                        },
                        email: {
                            type: 'string',
                            example: 'jane.smith@dell.com'
                        },
                        phone: {
                            type: 'string',
                            example: '+1-800-123-4567'
                        },
                        website: {
                            type: 'string',
                            example: 'https://www.dell.com'
                        },
                        category: {
                            type: 'string',
                            example: 'Hardware'
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive'],
                            example: 'active'
                        }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Authentication token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                ForbiddenError: {
                    description: 'Access denied - insufficient permissions',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                ValidationError: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: {
                                        type: 'boolean',
                                        example: false
                                    },
                                    errors: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                msg: {
                                                    type: 'string'
                                                },
                                                param: {
                                                    type: 'string'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and authorization endpoints'
            },
            {
                name: 'Users',
                description: 'User management endpoints'
            },
            {
                name: 'Assets',
                description: 'IT asset management endpoints'
            },
            {
                name: 'Licenses',
                description: 'Software license management endpoints'
            },
            {
                name: 'Departments',
                description: 'Department management endpoints'
            },
            {
                name: 'Vendors',
                description: 'Vendor management endpoints'
            }
        ]
    },
    apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.routes.js']
};

export const swaggerSpec = swaggerJsdoc(options);
