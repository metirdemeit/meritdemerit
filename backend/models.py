from tortoise import fields, models


class User(models.Model):
    """Abstract base user model."""
    id = fields.IntField(pk=True)
    telegram_id = fields.BigIntField(unique=True, null=True)
    username = fields.CharField(max_length=255, unique=True)
    password = fields.CharField(max_length=255)
    first_name = fields.CharField(max_length=255)
    last_name = fields.CharField(max_length=255, null=True)

    class Meta:
        abstract = True


class Class(models.Model):
    """Class model for school classes like 6А, 11Б, etc."""
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=10, unique=True)  # e.g., "6А", "11Б"
    def __str__(self):
        return f"Класс {self.name}"


class Student(User):
    """Student model."""
    school_class = fields.ForeignKeyField("models.Class", related_name="students")
    points = fields.IntField(default=100)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.school_class.name})"


class Teacher(User):
    """Teacher model."""
    homeroom_class = fields.ForeignKeyField(
        "models.Class", related_name="homeroom_teachers", null=True, on_delete=fields.SET_NULL
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Admin(User):
    """Admin model."""
    pass

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class DisciplineRule(models.Model):
    """Discipline rule model."""
    id = fields.IntField(pk=True)
    description = fields.TextField()
    points = fields.IntField()  # Can be positive or negative
    # Only two types are allowed for business logic. We store as text.
    # Using field name "type" to expose as-is via pydantic/tortoise serializers.
    type = fields.CharField(max_length=10, default="merit")
    # Access permission level: "all" (default), "teacher", "admin"
    access_level = fields.CharField(max_length=20, default="all")

    def __str__(self):
        return f"{self.description} ({self.points} points) [{self.access_level}]"


class LimitMD(models.Model):
    """Limits on how many times a student can be assigned a specific rule."""
    id = fields.IntField(pk=True)
    rule = fields.OneToOneField(
        "models.DisciplineRule", related_name="limit_config", on_delete=fields.CASCADE
    )
    max_uses = fields.IntField(default=1)
    reset_type = fields.CharField(max_length=20, default="period")  # "period" | "until_date"
    reset_period = fields.CharField(max_length=20, default="weekly")  # "daily" | "weekly" | "monthly" | "none"
    reset_date = fields.DateField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "limit_md"


class Intervention(models.Model):
    """Intervention record created when student points fall into risk zones."""
    id = fields.IntField(pk=True)
    student = fields.ForeignKeyField(
        "models.Student", related_name="interventions", on_delete=fields.CASCADE
    )
    level = fields.CharField(max_length=20)  # "warning" | "homeroom" | "counselor"
    status = fields.CharField(max_length=20, default="pending")  # "pending" | "resolved"
    parent_notified = fields.BooleanField(default=False)
    notes = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "intervention"



class PointHistory(models.Model):
    """Points history model."""
    id = fields.IntField(pk=True)
    student = fields.ForeignKeyField("models.Student", related_name="point_history", on_delete=fields.CASCADE)
    teacher = fields.ForeignKeyField("models.Teacher", related_name="given_points", null=True, on_delete=fields.SET_NULL)
    rule = fields.ForeignKeyField("models.DisciplineRule", related_name="applications", null=True, on_delete=fields.SET_NULL)
    points_changed = fields.IntField()
    comment = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} got {self.points_changed} points from {self.teacher} for {self.rule}"


class AdminPointHistory(models.Model):
    id = fields.IntField(pk=True)
    student = fields.ForeignKeyField("models.Student", related_name="admin_point_history", on_delete=fields.CASCADE)
    admin = fields.ForeignKeyField("models.Admin", related_name="given_points_by_admin", null=True, on_delete=fields.SET_NULL)
    rule = fields.ForeignKeyField("models.DisciplineRule", related_name="admin_applications", null=True, on_delete=fields.SET_NULL)
    points_changed = fields.IntField()
    comment = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} got {self.points_changed} points from Admin for {self.rule}"


class ExamWeek(models.Model):
    """Exam week periods where detention is automatically bypassed (deferred)."""
    id = fields.IntField(pk=True)
    title = fields.CharField(max_length=100)
    start_date = fields.DateField()
    end_date = fields.DateField()
    created_at = fields.DatetimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.start_date} – {self.end_date})"

    class Meta:
        table = "exam_week"


class DetentionHistory(models.Model):
    """Detention records. class_name and current_points are read via FK from Student."""
    id = fields.IntField(pk=True)

    # class_name → student.school_class.name (never denormalized)
    # current_points → student.points at query time (never stored here)
    student = fields.ForeignKeyField(
        "models.Student", related_name="detentions", on_delete=fields.CASCADE
    )
    # NULL means assigned by Admin
    assigned_by = fields.ForeignKeyField(
        "models.Teacher", related_name="assigned_detentions",
        null=True, on_delete=fields.SET_NULL
    )

    start_date = fields.DateField()
    end_date = fields.DateField()

    # active | completed | deferred | cancelled
    status = fields.CharField(max_length=20, default="active")
    notes = fields.TextField(null=True)
    # Set to 14 days after status → completed
    probation_end_date = fields.DateField(null=True)

    is_exam_bypass = fields.BooleanField(default=False)
    exam_week_title = fields.CharField(max_length=100, null=True)

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    def __str__(self):
        return f"Detention #{self.id} – student_id={self.student_id} [{self.status}]"

    class Meta:
        table = "detention_history"

