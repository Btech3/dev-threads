/**
 * Swagger/OpenAPI Configuration
 * Complete API documentation for the social media backend
 * All endpoints fully documented with Try it Out functionality
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Social Media App - Complete API Documentation',
    version: '1.0.0',
    description: 'Complete REST API for social media platform with real-time features, authentication, and full CRUD operations',
    contact: {
      name: 'Development Team',
      email: 'support@socialmedia.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:5234',
      description: 'Development Server'
    },
    {
      url: 'https://api.yourdomain.com',
      description: 'Production Server'
    }
  ],
  tags: [
    { name: 'Authentication', description: '🔐 User authentication endpoints' },
    { name: 'Users', description: '👤 User profile and management' },
    { name: 'Posts', description: '📝 Post creation and management' },
    { name: 'Engagements', description: '💬 Real-time engagements (likes, comments, shares, bookmarks)' },
    { name: 'Connections', description: '🤝 Follow/unfollow management' },
    { name: 'Messages', description: '💌 Direct messaging' },
    { name: 'Stories', description: '📖 Stories management' },
    { name: 'Health', description: '❤️ Server health check' }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: '❤️ API Health Check',
        description: 'Check if the API server is running and responding correctly',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: '✅ API is running successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time', example: '2025-07-25T10:35:00.000Z' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: '📝 Register New User Account',
        description: 'Create a new user account with email and password. Try it out suggestion: Use test email like "testuser@example.com"',
        operationId: 'registerUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'full_name'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'testuser@example.com' },
                  password: { type: 'string', format: 'password', example: 'SecurePass123!', minLength: 8 },
                  full_name: { type: 'string', example: 'Test User' },
                  username: { type: 'string', example: 'testuser123' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: '✅ User successfully registered and token returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User registered successfully' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - email already exists or validation failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Email already exists' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: '🔐 User Login',
        description: 'Authenticate user with email and password. Returns JWT token for API calls. Try it out suggestion: Use your registered email and password',
        operationId: 'loginUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'testuser@example.com' },
                  password: { type: 'string', format: 'password', example: 'SecurePass123!' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '✅ Login successful - token and user data returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '401': {
            description: '❌ Unauthorized - invalid email or password',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Invalid email or password' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/users/profile': {
      get: {
        tags: ['Users'],
        summary: '👤 Get Current User Profile',
        description: 'Retrieve authenticated user profile information. Try it out: Get token from login, paste in Authorize button',
        operationId: 'getCurrentUserProfile',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: '✅ User profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '401': {
            description: '❌ Unauthorized - token missing or invalid',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Unauthorized - token required' }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Users'],
        summary: '✏️ Update User Profile',
        description: 'Update user bio, location, or profile picture. Try it out suggestion: Update bio to "Updated bio text here"',
        operationId: 'updateUserProfile',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  full_name: { type: 'string', example: 'Updated Name' },
                  username: { type: 'string', example: 'updatedusername' },
                  bio: { type: 'string', example: 'Full Stack Developer | Tech Enthusiast' },
                  location: { type: 'string', example: 'San Francisco, CA' },
                  profile_picture: { type: 'string', format: 'uri', example: 'https://example.com/image.jpg' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '✅ Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Profile updated successfully' },
                    user: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - validation failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Invalid profile data' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/users/search': {
      get: {
        tags: ['Users'],
        summary: '🔍 Search Users',
        description: 'Search for users by username or name. Try it out suggestion: Search for "test" or any username',
        operationId: 'searchUsers',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: 'Search query (username or name)',
            required: true,
            schema: { type: 'string', example: 'test' }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results to return',
            schema: { type: 'integer', default: 10, example: 10 }
          }
        ],
        responses: {
          '200': {
            description: '✅ Search results returned successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    results: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    total: { type: 'integer', example: 5 }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - search query missing',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Search query required' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts/feed': {
      get: {
        tags: ['Posts'],
        summary: '📰 Get Feed (All Posts)',
        description: 'Get paginated feed of all posts ordered by latest first. Try it out: Use page=1 and limit=10',
        operationId: 'getFeedPosts',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1, example: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, example: 10 } }
        ],
        responses: {
          '200': {
            description: '✅ Feed posts retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    posts: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
                    total: { type: 'integer', example: 45 },
                    page: { type: 'integer', example: 1 },
                    pages: { type: 'integer', example: 5 }
                  }
                }
              }
            }
          },
          '401': {
            description: '❌ Unauthorized - authentication required',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Unauthorized' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts': {
      post: {
        tags: ['Posts'],
        summary: '✍️ Create New Post',
        description: 'Create post with text and optional media (5 files max, 10MB each). Try it out suggestion: Type "Hello World! This is my first post 🎉"',
        operationId: 'createPost',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', maxLength: 5000, example: 'Hello World! This is my first post 🎉' }
                }
              }
            },
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', example: 'Check out my new project!' },
                  media: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 5 }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: '✅ Post created successfully - broadcast via Socket.io to all users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Post created successfully' },
                    post: { $ref: '#/components/schemas/Post' }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - content required (1-5000 characters)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Post content is required (1-5000 characters)' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts/{postId}': {
      get: {
        tags: ['Posts'],
        summary: '📄 Get Single Post',
        description: 'Get a single post by ID with all engagement data. Try it out: Paste a valid post ID from feed',
        operationId: 'getSinglePost',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' } }
        ],
        responses: {
          '200': {
            description: '✅ Post retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    post: { $ref: '#/components/schemas/Post' }
                  }
                }
              }
            }
          },
          '404': {
            description: '❌ Not found - post does not exist',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Post not found' }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Posts'],
        summary: '✏️ Update Post',
        description: 'Update post content. Only post creator can edit. Try it out: Change content to something new',
        operationId: 'updatePost',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', maxLength: 5000, example: 'Updated post content!' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '✅ Post updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Post updated successfully' },
                    post: { $ref: '#/components/schemas/Post' }
                  }
                }
              }
            }
          },
          '403': {
            description: '❌ Forbidden - you can only edit your own posts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'You can only edit your own posts' }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Posts'],
        summary: '🗑️ Delete Post',
        description: 'Delete a post. Only post creator can delete. Try it out: Click Execute to delete',
        operationId: 'deletePost',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' } }
        ],
        responses: {
          '200': {
            description: '✅ Post deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Post deleted successfully' }
                  }
                }
              }
            }
          },
          '403': {
            description: '❌ Forbidden - you can only delete your own posts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'You can only delete your own posts' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts/{postId}/like': {
      post: {
        tags: ['Engagements'],
        summary: '❤️ Like Post',
        description: 'Like a post. Real-time update broadcast via Socket.io. Try it out: Click Execute to like',
        operationId: 'likePost',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' } }
        ],
        responses: {
          '200': {
            description: '✅ Post liked successfully - like count updated in real-time',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Post liked successfully' },
                    post: { $ref: '#/components/schemas/Post' }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - you already liked this post',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'You already liked this post' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts/{postId}/unlike': {
      post: {
        tags: ['Engagements'],
        summary: '🤍 Unlike Post',
        description: 'Remove like from a post. Real-time update broadcast. Try it out: Click Execute to unlike',
        operationId: 'unlikePost',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' } }
        ],
        responses: {
          '200': {
            description: '✅ Like removed successfully - like count updated in real-time',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Like removed successfully' },
                    post: { $ref: '#/components/schemas/Post' }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - you have not liked this post',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'You have not liked this post' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts/{postId}/comment': {
      post: {
        tags: ['Engagements'],
        summary: '💬 Add Comment',
        description: 'Add a comment to a post. Real-time broadcast via Socket.io. Try it out suggestion: Type "Great post! Thanks for sharing"',
        operationId: 'addComment',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string', maxLength: 500, example: 'Great post! Thanks for sharing' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: '✅ Comment added successfully - comment count updated in real-time',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Comment added successfully' },
                    post: { $ref: '#/components/schemas/Post' }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - comment text is required (1-500 characters)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Comment text is required (1-500 characters)' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts/{postId}/comment/{commentId}': {
      delete: {
        tags: ['Engagements'],
        summary: '🗑️ Delete Comment',
        description: 'Delete your own comment from a post. Try it out: Provide valid post and comment IDs',
        operationId: 'deleteComment',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' } },
          { name: 'commentId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c7654321' } }
        ],
        responses: {
          '200': {
            description: '✅ Comment deleted successfully - comment count updated in real-time',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Comment deleted successfully' },
                    post: { $ref: '#/components/schemas/Post' }
                  }
                }
              }
            }
          },
          '403': {
            description: '❌ Forbidden - you can only delete your own comments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'You can only delete your own comments' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts/{postId}/share': {
      post: {
        tags: ['Engagements'],
        summary: '🔄 Share Post',
        description: 'Share a post. Real-time broadcast via Socket.io. Try it out: Click Execute to share',
        operationId: 'sharePost',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' } }
        ],
        responses: {
          '200': {
            description: '✅ Post shared successfully - share count updated in real-time',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Post shared successfully' },
                    post: { $ref: '#/components/schemas/Post' }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - you already shared this post',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'You already shared this post' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts/{postId}/bookmark': {
      post: {
        tags: ['Engagements'],
        summary: '🔖 Bookmark Post',
        description: 'Bookmark a post for later. Real-time broadcast via Socket.io. Try it out: Click Execute',
        operationId: 'bookmarkPost',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' } }
        ],
        responses: {
          '200': {
            description: '✅ Post bookmarked successfully - bookmark count updated in real-time',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Post bookmarked successfully' },
                    post: { $ref: '#/components/schemas/Post' }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - you already bookmarked this post',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'You already bookmarked this post' }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Engagements'],
        summary: '🗑️ Remove Bookmark',
        description: 'Remove a bookmark from a post. Try it out: Click Execute',
        operationId: 'removeBookmark',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' } }
        ],
        responses: {
          '200': {
            description: '✅ Bookmark removed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Bookmark removed successfully' },
                    post: { $ref: '#/components/schemas/Post' }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - this post is not bookmarked',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'This post is not bookmarked' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/posts/{postId}/status': {
      get: {
        tags: ['Engagements'],
        summary: '📊 Get Post Engagement Status',
        description: 'Get current user engagement status for a post (liked, bookmarked, etc). Try it out: Paste a valid post ID',
        operationId: 'getPostStatus',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' } }
        ],
        responses: {
          '200': {
            description: '✅ Engagement status retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    status: {
                      type: 'object',
                      properties: {
                        isLiked: { type: 'boolean', example: true },
                        isBookmarked: { type: 'boolean', example: false },
                        isShared: { type: 'boolean', example: true },
                        likeCount: { type: 'integer', example: 42 },
                        commentCount: { type: 'integer', example: 15 },
                        shareCount: { type: 'integer', example: 8 },
                        bookmarkCount: { type: 'integer', example: 5 }
                      }
                    }
                  }
                }
              }
            }
          },
          '404': {
            description: '❌ Not found - post does not exist',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Post not found' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/connections/follow/{userId}': {
      post: {
        tags: ['Connections'],
        summary: '➕ Follow User',
        description: 'Follow another user. Real-time broadcast. Try it out: Paste a valid user ID',
        operationId: 'followUser',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', example: 'user_2zdFoZib5lNr614LgkONdD8WG32' } }
        ],
        responses: {
          '200': {
            description: '✅ User followed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User followed successfully' },
                    followingCount: { type: 'integer', example: 42 }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - you already follow this user or trying to follow yourself',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'You already follow this user' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/connections/unfollow/{userId}': {
      post: {
        tags: ['Connections'],
        summary: '➖ Unfollow User',
        description: 'Unfollow a user. Real-time broadcast. Try it out: Paste a valid user ID',
        operationId: 'unfollowUser',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', example: 'user_2zdFoZib5lNr614LgkONdD8WG32' } }
        ],
        responses: {
          '200': {
            description: '✅ User unfollowed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User unfollowed successfully' },
                    followingCount: { type: 'integer', example: 41 }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - you do not follow this user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'You do not follow this user' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/connections/followers': {
      get: {
        tags: ['Connections'],
        summary: '👥 Get Followers List',
        description: 'Get list of your followers. Try it out: Use page=1 and limit=10',
        operationId: 'getFollowers',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1, example: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, example: 10 } }
        ],
        responses: {
          '200': {
            description: '✅ Followers list retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    followers: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    total: { type: 'integer', example: 125 },
                    page: { type: 'integer', example: 1 }
                  }
                }
              }
            }
          },
          '401': {
            description: '❌ Unauthorized - authentication required',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Unauthorized' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/connections/following': {
      get: {
        tags: ['Connections'],
        summary: '👤 Get Following List',
        description: 'Get list of users you follow. Try it out: Use page=1 and limit=10',
        operationId: 'getFollowing',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1, example: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, example: 10 } }
        ],
        responses: {
          '200': {
            description: '✅ Following list retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    following: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    total: { type: 'integer', example: 87 },
                    page: { type: 'integer', example: 1 }
                  }
                }
              }
            }
          },
          '401': {
            description: '❌ Unauthorized - authentication required',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Unauthorized' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/messages': {
      get: {
        tags: ['Messages'],
        summary: '💌 Get All Conversations',
        description: 'Get list of all conversations. Try it out: Use page=1 and limit=10',
        operationId: 'getConversations',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1, example: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, example: 10 } }
        ],
        responses: {
          '200': {
            description: '✅ Conversations retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    conversations: { type: 'array', items: { type: 'object' } },
                    total: { type: 'integer', example: 15 }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Messages'],
        summary: '✉️ Send Message',
        description: 'Send direct message to user. Real-time delivery via Socket.io. Try it out suggestion: Type "Hello! How are you?"',
        operationId: 'sendMessage',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipientId', 'content'],
                properties: {
                  recipientId: { type: 'string', example: 'user_456' },
                  content: { type: 'string', example: 'Hello! How are you doing?' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: '✅ Message sent successfully - delivered via Socket.io in real-time',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Message sent successfully' },
                    data: { $ref: '#/components/schemas/Message' }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - missing content or recipient',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Message content and recipient are required' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/messages/{userId}': {
      get: {
        tags: ['Messages'],
        summary: '💬 Get Messages with User',
        description: 'Get all messages with a specific user. Try it out: Paste a valid user ID',
        operationId: 'getMessages',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', example: 'user_2zdFoZib5lNr614LgkONdD8WG32' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1, example: 1 } }
        ],
        responses: {
          '200': {
            description: '✅ Messages retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    messages: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
                    total: { type: 'integer', example: 45 }
                  }
                }
              }
            }
          },
          '404': {
            description: '❌ Not found - user does not exist',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'User not found' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/messages/{messageId}/read': {
      put: {
        tags: ['Messages'],
        summary: '✅ Mark Message as Read',
        description: 'Mark a message as read. Update broadcast via Socket.io. Try it out: Provide valid message ID',
        operationId: 'markMessageAsRead',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'messageId', in: 'path', required: true, schema: { type: 'string', example: 'msg_65a7f3c2e4f6d8b9c1234567' } }
        ],
        responses: {
          '200': {
            description: '✅ Message marked as read successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Message marked as read' },
                    data: { $ref: '#/components/schemas/Message' }
                  }
                }
              }
            }
          },
          '404': {
            description: '❌ Not found - message does not exist',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Message not found' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/stories': {
      get: {
        tags: ['Stories'],
        summary: '📖 Get Feed Stories',
        description: 'Get stories from users you follow (24 hours only). Try it out: Use page=1',
        operationId: 'getFeedStories',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1, example: 1 } }
        ],
        responses: {
          '200': {
            description: '✅ Stories retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    stories: { type: 'array', items: { type: 'object' } },
                    total: { type: 'integer', example: 28 }
                  }
                }
              }
            }
          },
          '401': {
            description: '❌ Unauthorized - authentication required',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Unauthorized' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Stories'],
        summary: '📷 Create Story',
        description: 'Create story with text/image. Stories expire in 24 hours. Try it out suggestion: Type "Just woke up! 🌞"',
        operationId: 'createStory',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string', example: 'Just woke up! 🌞' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: '✅ Story created successfully - broadcast via Socket.io',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Story created successfully' },
                    story: { type: 'object' }
                  }
                }
              }
            }
          },
          '400': {
            description: '❌ Bad request - content or media required',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Story content or media is required' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/stories/{userId}': {
      get: {
        tags: ['Stories'],
        summary: '📸 Get User Stories',
        description: 'Get all active stories (24h) from a specific user. Try it out: Paste valid user ID',
        operationId: 'getUserStories',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', example: 'user_2zdFoZib5lNr614LgkONdD8WG32' } }
        ],
        responses: {
          '200': {
            description: '✅ User stories retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    stories: { type: 'array', items: { type: 'object' } },
                    total: { type: 'integer', example: 3 }
                  }
                }
              }
            }
          },
          '404': {
            description: '❌ Not found - user does not exist',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'User not found' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token in format: Bearer <token>'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['_id', 'email'],
        properties: {
          _id: { type: 'string', example: 'user_2zdFoZib5lNr614LgkONdD8WG32' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          full_name: { type: 'string', example: 'John Doe' },
          username: { type: 'string', example: 'johndoe' },
          bio: { type: 'string', example: 'Full Stack Developer' },
          profile_picture: { type: 'string', format: 'uri', example: 'https://example.com/avatar.jpg' },
          location: { type: 'string', example: 'San Francisco, CA' },
          followers: { type: 'array', items: { type: 'string' }, example: ['user_2', 'user_3'] },
          following: { type: 'array', items: { type: 'string' }, example: ['user_4', 'user_5'] },
          is_verified: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time', example: '2025-07-09T09:26:59.231Z' }
        }
      },
      Post: {
        type: 'object',
        required: ['_id', 'userId', 'content'],
        properties: {
          _id: { type: 'string', example: '65a7f3c2e4f6d8b9c1234567' },
          userId: { type: 'string', example: 'user_123' },
          user: { $ref: '#/components/schemas/User' },
          content: { type: 'string', example: 'Just launched my new project!' },
          media: { type: 'array', items: { type: 'string', format: 'uri' }, example: ['https://example.com/image.jpg'] },
          likes: { type: 'array', items: { type: 'string' }, example: ['user_2', 'user_3'] },
          likeCount: { type: 'integer', example: 42 },
          comments: { type: 'array', items: { type: 'object' } },
          commentCount: { type: 'integer', example: 15 },
          shares: { type: 'array', items: { type: 'string' }, example: ['user_6', 'user_7'] },
          shareCount: { type: 'integer', example: 8 },
          bookmarks: { type: 'array', items: { type: 'string' }, example: ['user_8'] },
          bookmarkCount: { type: 'integer', example: 5 },
          createdAt: { type: 'string', format: 'date-time', example: '2025-07-16T05:54:31.191Z' }
        }
      },
      Message: {
        type: 'object',
        required: ['_id', 'senderId', 'recipientId', 'content'],
        properties: {
          _id: { type: 'string', example: 'msg_65a7f3c2e4f6d8b9c1234567' },
          senderId: { type: 'string', example: 'user_123' },
          recipientId: { type: 'string', example: 'user_456' },
          content: { type: 'string', example: 'Hi! How are you doing?' },
          media_url: { type: 'string', format: 'uri' },
          isRead: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time', example: '2025-07-25T10:35:00.000Z' }
        }
      }
    }
  },
  security: [{ BearerAuth: [] }]
};

export default swaggerDefinition;
