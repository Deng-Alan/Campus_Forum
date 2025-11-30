# 武冈三中校园论坛 - 后端服务

## 技术栈

- **框架**: Spring Boot 2.7.17
- **JDK**: Java 17
- **数据库**: PostgreSQL 18.0
- **ORM**: MyBatis Plus 3.5.4
- **缓存**: Redis 7.2
- **安全**: Spring Security + JWT 0.11.5
- **文档**: Knife4j (Swagger)

## 项目结构

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/campus/forum/
│   │   │   ├── config/          # 配置类
│   │   │   ├── controller/      # 控制器
│   │   │   ├── service/         # 服务层
│   │   │   │   └── impl/        # 服务实现
│   │   │   ├── mapper/          # MyBatis Mapper
│   │   │   ├── entity/          # 实体类
│   │   │   ├── dto/             # 数据传输对象
│   │   │   ├── vo/              # 视图对象
│   │   │   ├── common/          # 公共类
│   │   │   ├── exception/       # 异常处理
│   │   │   ├── security/        # 安全相关
│   │   │   └── util/            # 工具类
│   │   └── resources/
│   │       ├── mapper/          # MyBatis XML 映射文件
│   │       ├── application.yml  # 配置文件
│   │       └── logback-spring.xml
│   └── test/                    # 测试代码
├── pom.xml                      # Maven 配置
└── README.md
```

## 快速开始

### 1. 环境要求

- JDK 17+
- Maven 3.6+
- PostgreSQL 18.0+
- Redis 7.2+

### 2. 配置数据库

修改 `src/main/resources/application.yml` 中的数据库配置：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/campus_forum
    username: your_username
    password: your_password
```

### 3. 配置 Redis

```yaml
spring:
  redis:
    host: localhost
    port: 6379
    password: your_redis_password
```

### 4. 初始化数据库

执行项目根目录下的 `init_database.sql` 文件。

### 5. 运行项目

```bash
# 使用 Maven 运行
mvn spring-boot:run

# 或者打包后运行
mvn clean package
java -jar target/campus-forum-1.0.0.jar
```

### 6. 访问 API 文档

启动项目后访问: http://localhost:8080/api/doc.html

## API 接口

### 认证模块

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/logout | 用户登出 |
| POST | /api/auth/refresh-token | 刷新令牌 |
| GET | /api/auth/captcha | 获取验证码 |

### 用户模块

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/users/me | 获取当前用户信息 |
| PUT | /api/users/me | 更新用户信息 |
| PUT | /api/users/me/password | 修改密码 |
| GET | /api/users/{id}/profile | 获取用户公开资料 |

## 环境配置

项目支持多环境配置：

- `default`: 默认配置
- `dev`: 开发环境
- `prod`: 生产环境

通过启动参数切换环境：

```bash
java -jar campus-forum-1.0.0.jar --spring.profiles.active=prod
```

## 开发指南

### 添加新模块

1. 在 `entity/` 创建实体类
2. 在 `mapper/` 创建 Mapper 接口
3. 在 `service/` 创建 Service 接口和实现
4. 在 `controller/` 创建 Controller
5. 在 `dto/` 和 `vo/` 创建数据传输对象

### 代码规范

- 遵循阿里巴巴 Java 开发手册
- 使用 Lombok 简化代码
- 所有接口需要添加 Swagger 注解
- 业务异常使用 BusinessException 抛出
